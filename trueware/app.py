"""Trueware — application web de vente en ligne.

Site complet rendu côté serveur : catalogue, fiches produits, panier,
inscription / connexion, commande, compte client et administration.
Base de données SQLite, sessions signées, jetons anti-CSRF sur tous les
formulaires, mots de passe hachés (PBKDF2-SHA256 via Werkzeug).
"""
from __future__ import annotations

import os
import re
import secrets
import time
from collections import defaultdict, deque
from pathlib import Path

from flask import (
    Flask, abort, flash, g, jsonify, redirect, render_template, request,
    session, url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from .db import close_db, execute, get_db, init_db, now, query, secret_key
from .imagery import product_art

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$")
PER_PAGE = 9
FREE_SHIPPING_CENTS = 10000
SHIPPING_CENTS = 490
MAX_QTY = 10
ORDER_STATUSES = ["En préparation", "Expédiée", "Livrée", "Annulée"]

# Anti-force brute sur la connexion : fenêtre glissante en mémoire.
_LOGIN_FAILS: dict[str, deque] = defaultdict(deque)
LOGIN_WINDOW = 300
LOGIN_MAX_FAILS = 10


# --------------------------------------------------------------------------- #
# Fabrique d'application
# --------------------------------------------------------------------------- #

def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)
    data_dir = Path(os.environ.get("TRUEWARE_DATA_DIR", "data"))

    app.config.update(
        DATABASE=os.environ.get("TRUEWARE_DB", str(data_dir / "trueware.db")),
        SECRET_KEY=secret_key(data_dir),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("TRUEWARE_HTTPS", "0") == "1",
        PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 14,
        MAX_CONTENT_LENGTH=1024 * 1024,
        SHOP_NAME="Trueware",
    )
    if config:
        app.config.update(config)

    app.teardown_appcontext(close_db)
    app.jinja_env.globals.update(
        product_art=product_art,
        csrf_token=lambda: session.get("csrf", ""),
        shop_name=app.config["SHOP_NAME"],
        order_statuses=ORDER_STATUSES,
    )
    app.jinja_env.filters["eur"] = fmt_eur

    register_routes(app)
    init_db(app)
    return app


def fmt_eur(cents: int | None) -> str:
    """42990 -> '429,90 €' (espace insécable avant le symbole)."""
    if cents is None:
        return ""
    return f"{cents // 100},{cents % 100:02d} €"


# --------------------------------------------------------------------------- #
# Session, CSRF, utilisateur courant
# --------------------------------------------------------------------------- #

def current_user():
    if "user" not in g:
        uid = session.get("uid")
        g.user = query("SELECT * FROM users WHERE id = ?", (uid,), one=True) if uid else None
    return g.user


def login_user(user_id: int) -> None:
    session.clear()
    session["uid"] = user_id
    session["csrf"] = secrets.token_urlsafe(32)
    session.permanent = True


def require_login():
    if current_user() is None:
        flash("Connectez-vous pour continuer.", "info")
        return redirect(url_for("login", suivant=request.full_path))
    return None


def require_admin():
    user = current_user()
    if user is None:
        return require_login()
    if not user["is_admin"]:
        abort(403)
    return None


# --------------------------------------------------------------------------- #
# Panier : session pour les visiteurs, base de données pour les comptes
# --------------------------------------------------------------------------- #

def cart_raw() -> dict[int, int]:
    user = current_user()
    if user:
        rows = query("SELECT product_id, qty FROM cart_items WHERE user_id = ?", (user["id"],))
        return {r["product_id"]: r["qty"] for r in rows}
    return {int(k): int(v) for k, v in session.get("cart", {}).items()}


def cart_set(product_id: int, qty: int) -> None:
    user = current_user()
    qty = max(0, min(MAX_QTY, qty))
    if user:
        if qty:
            execute(
                """INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)
                   ON CONFLICT(user_id, product_id) DO UPDATE SET qty = excluded.qty""",
                (user["id"], product_id, qty),
            )
        else:
            execute("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
                    (user["id"], product_id))
    else:
        cart = {int(k): int(v) for k, v in session.get("cart", {}).items()}
        if qty:
            cart[product_id] = qty
        else:
            cart.pop(product_id, None)
        session["cart"] = {str(k): v for k, v in cart.items()}


def merge_guest_cart(user_id: int, guest: dict[int, int]) -> None:
    """Fusionne le panier visiteur dans celui du compte à la connexion."""
    for pid, qty in guest.items():
        row = query("SELECT qty FROM cart_items WHERE user_id = ? AND product_id = ?",
                    (user_id, pid), one=True)
        total = min(MAX_QTY, (row["qty"] if row else 0) + qty)
        execute(
            """INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)
               ON CONFLICT(user_id, product_id) DO UPDATE SET qty = excluded.qty""",
            (user_id, pid, total),
        )


def cart_view() -> dict:
    """Lignes du panier enrichies des produits, avec totaux et alertes de stock."""
    raw = cart_raw()
    lines, subtotal, issues = [], 0, []
    if raw:
        marks = ",".join("?" * len(raw))
        rows = query(
            f"""SELECT p.*, c.slug AS cat_slug FROM products p
                JOIN categories c ON c.id = p.category_id
                WHERE p.id IN ({marks})""",
            tuple(raw),
        )
        for p in rows:
            qty = raw[p["id"]]
            if not p["active"]:
                issues.append(f"{p['name']} n'est plus disponible et a été retiré du panier.")
                cart_set(p["id"], 0)
                continue
            if qty > p["stock"]:
                qty = p["stock"]
                if qty == 0:
                    issues.append(f"{p['name']} est en rupture de stock.")
                    cart_set(p["id"], 0)
                    continue
                issues.append(f"Stock limité : {p['name']} ramené à {qty}.")
                cart_set(p["id"], qty)
            line_total = p["price_cents"] * qty
            subtotal += line_total
            lines.append({"product": p, "qty": qty, "total": line_total})
    lines.sort(key=lambda l: l["product"]["name"])
    shipping = 0 if (subtotal == 0 or subtotal >= FREE_SHIPPING_CENTS) else SHIPPING_CENTS
    return {
        "lines": lines,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": subtotal + shipping,
        "count": sum(l["qty"] for l in lines),
        "issues": issues,
    }


# --------------------------------------------------------------------------- #
# Requêtes catalogue
# --------------------------------------------------------------------------- #

PRODUCT_SELECT = """
SELECT p.*, c.slug AS cat_slug, c.name AS cat_name,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id) AS rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count
FROM products p JOIN categories c ON c.id = p.category_id
"""

SORTS = {
    "pertinence": "p.featured DESC, p.name ASC",
    "prix-croissant": "p.price_cents ASC",
    "prix-decroissant": "p.price_cents DESC",
    "nouveautes": "p.created_at DESC, p.id DESC",
    "note": "rating DESC NULLS LAST, review_count DESC",
}


def parse_specs(raw: str) -> list[tuple[str, str]]:
    out = []
    for line in (raw or "").splitlines():
        if "|" in line:
            key, _, value = line.partition("|")
            out.append((key.strip(), value.strip()))
    return out


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #

def register_routes(app: Flask) -> None:  # noqa: C901 — regroupement volontaire

    @app.before_request
    def _guard():
        if "csrf" not in session:
            session["csrf"] = secrets.token_urlsafe(32)
        if request.method == "POST":
            sent = request.form.get("csrf_token", "")
            if not sent or not secrets.compare_digest(sent, session.get("csrf", "")):
                abort(400, "Jeton de sécurité invalide ou expiré. Rechargez la page.")

    @app.context_processor
    def _inject():
        return {
            "user": current_user(),
            "cart_count": sum(cart_raw().values()),
            "categories": query("SELECT * FROM categories ORDER BY rank, name"),
            "current_path": request.path,
        }

    @app.after_request
    def _headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; "
            "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
            "font-src https://fonts.gstatic.com; script-src 'self'; "
            "base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        )
        return resp

    # ----------------------------- vitrine ---------------------------------- #

    @app.get("/")
    def home():
        featured = query(PRODUCT_SELECT + """
            WHERE p.active = 1 AND p.featured = 1 ORDER BY p.name LIMIT 6""")
        fresh = query(PRODUCT_SELECT + """
            WHERE p.active = 1 ORDER BY p.created_at DESC, p.id DESC LIMIT 4""")
        deals = query(PRODUCT_SELECT + """
            WHERE p.active = 1 AND p.compare_cents IS NOT NULL
              AND p.compare_cents > p.price_cents
            ORDER BY (p.compare_cents - p.price_cents) DESC LIMIT 3""")
        stats = query(
            """SELECT (SELECT COUNT(*) FROM products WHERE active = 1) AS products,
                      (SELECT COUNT(*) FROM categories) AS cats,
                      (SELECT COUNT(*) FROM reviews) AS reviews""",
            one=True,
        )
        return render_template("index.html", featured=featured, fresh=fresh,
                               deals=deals, stats=stats)

    @app.get("/catalogue")
    def catalogue():
        q = (request.args.get("q") or "").strip()
        cat = (request.args.get("categorie") or "").strip()
        sort = request.args.get("tri") if request.args.get("tri") in SORTS else "pertinence"
        try:
            page = max(1, int(request.args.get("page", 1)))
        except ValueError:
            page = 1

        where, args = ["p.active = 1"], []
        if q:
            where.append("(p.name LIKE ? OR p.brand LIKE ? OR p.summary LIKE ?)")
            args += [f"%{q}%"] * 3
        if cat:
            where.append("c.slug = ?")
            args.append(cat)
        clause = " WHERE " + " AND ".join(where)

        total = query(
            "SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id"
            + clause, tuple(args), one=True)["n"]
        pages = max(1, -(-total // PER_PAGE))
        page = min(page, pages)
        products = query(
            PRODUCT_SELECT + clause + f" ORDER BY {SORTS[sort]} LIMIT ? OFFSET ?",
            tuple(args) + (PER_PAGE, (page - 1) * PER_PAGE),
        )
        active_cat = query("SELECT * FROM categories WHERE slug = ?", (cat,), one=True) if cat else None
        return render_template("catalogue.html", products=products, total=total, page=page,
                               pages=pages, q=q, cat=cat, sort=sort, active_cat=active_cat)

    @app.get("/produit/<slug>")
    def product(slug):
        p = query(PRODUCT_SELECT + " WHERE p.slug = ?", (slug,), one=True)
        if p is None or not p["active"]:
            abort(404)
        reviews = query(
            """SELECT r.*, u.name AS author FROM reviews r JOIN users u ON u.id = r.user_id
               WHERE r.product_id = ? ORDER BY r.created_at DESC""", (p["id"],))
        user = current_user()
        mine = next((r for r in reviews if user and r["user_id"] == user["id"]), None)
        similar = query(
            PRODUCT_SELECT + """ WHERE p.active = 1 AND p.category_id = ? AND p.id <> ?
                                 ORDER BY RANDOM() LIMIT 3""", (p["category_id"], p["id"]))
        return render_template("produit.html", p=p, specs=parse_specs(p["specs"]),
                               reviews=reviews, mine=mine, similar=similar)

    @app.post("/produit/<slug>/avis")
    def review(slug):
        redirect_needed = require_login()
        if redirect_needed:
            return redirect_needed
        p = query("SELECT id FROM products WHERE slug = ? AND active = 1", (slug,), one=True)
        if p is None:
            abort(404)
        try:
            rating = int(request.form.get("rating", 0))
        except ValueError:
            rating = 0
        body = (request.form.get("body") or "").strip()[:1200]
        if rating < 1 or rating > 5:
            flash("Choisissez une note entre 1 et 5.", "error")
        else:
            execute(
                """INSERT INTO reviews (product_id, user_id, rating, body, created_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(product_id, user_id)
                   DO UPDATE SET rating = excluded.rating, body = excluded.body,
                                 created_at = excluded.created_at""",
                (p["id"], current_user()["id"], rating, body, now()),
            )
            flash("Merci, votre avis est publié.", "success")
        return redirect(url_for("product", slug=slug) + "#avis")

    # ------------------------------ panier ---------------------------------- #

    @app.post("/panier/ajouter")
    def cart_add():
        try:
            pid = int(request.form.get("product_id", 0))
            qty = int(request.form.get("qty", 1))
        except ValueError:
            abort(400)
        p = query("SELECT * FROM products WHERE id = ? AND active = 1", (pid,), one=True)
        if p is None:
            abort(404)
        if p["stock"] <= 0:
            flash(f"{p['name']} est en rupture de stock.", "error")
            return redirect(request.form.get("retour") or url_for("product", slug=p["slug"]))
        have = cart_raw().get(pid, 0)
        want = max(1, min(MAX_QTY, have + max(1, qty)))
        if want > p["stock"]:
            want = p["stock"]
            flash(f"Stock disponible : {want} unité(s) de {p['name']}.", "info")
        else:
            flash(f"{p['name']} ajouté au panier.", "success")
        cart_set(pid, want)
        return redirect(request.form.get("retour") or url_for("cart"))

    @app.get("/panier")
    def cart():
        view = cart_view()
        for msg in view["issues"]:
            flash(msg, "info")
        return render_template("panier.html", cart=cart_view() if view["issues"] else view,
                               free_from=FREE_SHIPPING_CENTS, shipping_flat=SHIPPING_CENTS)

    @app.post("/panier/modifier")
    def cart_update():
        try:
            pid = int(request.form.get("product_id", 0))
        except ValueError:
            abort(400)
        if request.form.get("action") == "supprimer":
            cart_set(pid, 0)
            flash("Article retiré du panier.", "info")
        else:
            try:
                qty = int(request.form.get("qty", 1))
            except ValueError:
                qty = 1
            p = query("SELECT stock, name FROM products WHERE id = ?", (pid,), one=True)
            if p and qty > p["stock"]:
                qty = p["stock"]
                flash(f"Stock limité : {p['name']} ramené à {qty}.", "info")
            cart_set(pid, qty)
        return redirect(url_for("cart"))

    # ---------------------------- inscription ------------------------------- #

    @app.route("/inscription", methods=["GET", "POST"])
    def register():
        if current_user():
            return redirect(url_for("account"))
        form = {"name": "", "email": ""}
        if request.method == "POST":
            form["name"] = (request.form.get("name") or "").strip()
            form["email"] = (request.form.get("email") or "").strip().lower()
            pwd = request.form.get("password") or ""
            pwd2 = request.form.get("password2") or ""
            errors = []
            if not 2 <= len(form["name"]) <= 60:
                errors.append("Le nom doit contenir entre 2 et 60 caractères.")
            if not EMAIL_RE.match(form["email"]) or len(form["email"]) > 160:
                errors.append("Adresse e-mail invalide.")
            if len(pwd) < 8:
                errors.append("Le mot de passe doit contenir au moins 8 caractères.")
            if pwd != pwd2:
                errors.append("Les deux mots de passe ne correspondent pas.")
            if not errors and query("SELECT 1 FROM users WHERE email = ?", (form["email"],), one=True):
                errors.append("Un compte existe déjà avec cette adresse.")
            if errors:
                for e in errors:
                    flash(e, "error")
            else:
                guest = cart_raw()
                cur = execute(
                    """INSERT INTO users (email, name, password_hash, created_at)
                       VALUES (?, ?, ?, ?)""",
                    (form["email"], form["name"], generate_password_hash(pwd), now()),
                )
                uid = cur.lastrowid
                login_user(uid)
                g.pop("user", None)
                if guest:
                    merge_guest_cart(uid, guest)
                flash(f"Bienvenue {form['name']} ! Votre compte est créé.", "success")
                return redirect(url_for("account"))
        return render_template("inscription.html", form=form)

    @app.route("/connexion", methods=["GET", "POST"])
    def login():
        if current_user():
            return redirect(url_for("account"))
        nxt = request.args.get("suivant") or request.form.get("suivant") or ""
        email = ""
        if request.method == "POST":
            email = (request.form.get("email") or "").strip().lower()
            pwd = request.form.get("password") or ""
            ip = request.remote_addr or "?"
            fails = _LOGIN_FAILS[ip]
            cutoff = time.time() - LOGIN_WINDOW
            while fails and fails[0] < cutoff:
                fails.popleft()
            if len(fails) >= LOGIN_MAX_FAILS:
                flash("Trop de tentatives échouées. Réessayez dans quelques minutes.", "error")
                return render_template("connexion.html", email=email, suivant=nxt), 429

            row = query("SELECT * FROM users WHERE email = ?", (email,), one=True)
            if row and check_password_hash(row["password_hash"], pwd):
                fails.clear()
                guest = cart_raw()
                login_user(row["id"])
                g.pop("user", None)
                if guest:
                    merge_guest_cart(row["id"], guest)
                flash(f"Content de vous revoir, {row['name']}.", "success")
                if nxt.startswith("/") and not nxt.startswith("//"):
                    return redirect(nxt)
                return redirect(url_for("account"))
            fails.append(time.time())
            flash("Adresse e-mail ou mot de passe incorrect.", "error")
        return render_template("connexion.html", email=email, suivant=nxt)

    @app.post("/deconnexion")
    def logout():
        session.clear()
        flash("Vous êtes déconnecté.", "info")
        return redirect(url_for("home"))

    # ------------------------------ compte ---------------------------------- #

    @app.route("/compte", methods=["GET", "POST"])
    def account():
        redirect_needed = require_login()
        if redirect_needed:
            return redirect_needed
        user = current_user()
        if request.method == "POST":
            if request.form.get("form") == "password":
                cur_pwd = request.form.get("current") or ""
                new = request.form.get("password") or ""
                new2 = request.form.get("password2") or ""
                if not check_password_hash(user["password_hash"], cur_pwd):
                    flash("Mot de passe actuel incorrect.", "error")
                elif len(new) < 8:
                    flash("Le nouveau mot de passe doit contenir au moins 8 caractères.", "error")
                elif new != new2:
                    flash("Les deux mots de passe ne correspondent pas.", "error")
                else:
                    execute("UPDATE users SET password_hash = ? WHERE id = ?",
                            (generate_password_hash(new), user["id"]))
                    flash("Mot de passe mis à jour.", "success")
            else:
                name = (request.form.get("name") or "").strip()
                if not 2 <= len(name) <= 60:
                    flash("Le nom doit contenir entre 2 et 60 caractères.", "error")
                else:
                    execute(
                        """UPDATE users SET name = ?, address = ?, zip = ?, city = ?, country = ?
                           WHERE id = ?""",
                        (name,
                         (request.form.get("address") or "").strip()[:160],
                         (request.form.get("zip") or "").strip()[:16],
                         (request.form.get("city") or "").strip()[:80],
                         (request.form.get("country") or "").strip()[:60] or "France",
                         user["id"]),
                    )
                    flash("Coordonnées enregistrées.", "success")
            g.pop("user", None)
            return redirect(url_for("account"))

        orders = query(
            """SELECT o.*, (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS lines
               FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC, o.id DESC""",
            (user["id"],))
        my_reviews = query(
            """SELECT r.*, p.name, p.slug FROM reviews r JOIN products p ON p.id = r.product_id
               WHERE r.user_id = ? ORDER BY r.created_at DESC""", (user["id"],))
        return render_template("compte.html", orders=orders, my_reviews=my_reviews)

    # ----------------------------- commande --------------------------------- #

    @app.route("/commande", methods=["GET", "POST"])
    def checkout():
        redirect_needed = require_login()
        if redirect_needed:
            return redirect_needed
        user = current_user()
        view = cart_view()
        if not view["lines"]:
            flash("Votre panier est vide.", "info")
            return redirect(url_for("catalogue"))

        form = {
            "ship_name": user["name"], "ship_address": user["address"],
            "ship_zip": user["zip"], "ship_city": user["city"],
            "ship_country": user["country"] or "France",
        }
        if request.method == "POST":
            for key in form:
                form[key] = (request.form.get(key) or "").strip()[:160]
            errors = [
                label for key, label in [
                    ("ship_name", "Nom du destinataire requis."),
                    ("ship_address", "Adresse requise."),
                    ("ship_zip", "Code postal requis."),
                    ("ship_city", "Ville requise."),
                    ("ship_country", "Pays requis."),
                ] if not form[key]
            ]
            if errors:
                for e in errors:
                    flash(e, "error")
            else:
                ref = place_order(user, view, form)
                if ref is None:
                    flash("Le stock a changé pendant la validation, vérifiez votre panier.", "error")
                    return redirect(url_for("cart"))
                return redirect(url_for("order_done", reference=ref))
        return render_template("commande.html", cart=view, form=form)

    @app.get("/commande/<reference>")
    def order_done(reference):
        redirect_needed = require_login()
        if redirect_needed:
            return redirect_needed
        order = query("SELECT * FROM orders WHERE reference = ?", (reference,), one=True)
        if order is None:
            abort(404)
        user = current_user()
        if order["user_id"] != user["id"] and not user["is_admin"]:
            abort(403)
        items = query("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", (order["id"],))
        return render_template("confirmation.html", order=order, items=items)

    # --------------------------- administration ----------------------------- #

    @app.get("/admin")
    def admin_home():
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        stats = query(
            """SELECT (SELECT COUNT(*) FROM users)                          AS users,
                      (SELECT COUNT(*) FROM products WHERE active = 1)      AS products,
                      (SELECT COUNT(*) FROM orders)                         AS orders,
                      (SELECT COALESCE(SUM(total_cents), 0) FROM orders
                        WHERE status <> 'Annulée')                          AS revenue,
                      (SELECT COUNT(*) FROM orders WHERE status = 'En préparation') AS pending""",
            one=True)
        low = query(
            """SELECT * FROM products WHERE active = 1 AND stock <= 10
               ORDER BY stock ASC, name LIMIT 8""")
        recent = query(
            """SELECT o.*, u.email FROM orders o JOIN users u ON u.id = o.user_id
               ORDER BY o.created_at DESC, o.id DESC LIMIT 8""")
        top = query(
            """SELECT i.name, i.slug, SUM(i.qty) AS units,
                      SUM(i.qty * i.unit_price_cents) AS revenue
               FROM order_items i JOIN orders o ON o.id = i.order_id
               WHERE o.status <> 'Annulée'
               GROUP BY i.slug ORDER BY units DESC LIMIT 6""")
        return render_template("admin/index.html", stats=stats, low=low, recent=recent, top=top)

    @app.get("/admin/produits")
    def admin_products():
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        q = (request.args.get("q") or "").strip()
        sql = PRODUCT_SELECT + (" WHERE p.name LIKE ? OR p.brand LIKE ?" if q else "")
        args = (f"%{q}%", f"%{q}%") if q else ()
        products = query(sql + " ORDER BY p.active DESC, p.name", args)
        return render_template("admin/produits.html", products=products, q=q)

    @app.route("/admin/produits/nouveau", methods=["GET", "POST"])
    @app.route("/admin/produits/<int:pid>", methods=["GET", "POST"])
    def admin_product_form(pid: int | None = None):
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        p = None
        if pid is not None:
            p = query("SELECT * FROM products WHERE id = ?", (pid,), one=True)
            if p is None:
                abort(404)

        if request.method == "POST":
            data, errors = read_product_form(request.form, pid)
            if errors:
                for e in errors:
                    flash(e, "error")
                return render_template("admin/produit_form.html", p=p,
                                       form=dict(request.form),
                                       cats=query("SELECT * FROM categories ORDER BY rank"))
            if pid is None:
                execute(
                    """INSERT INTO products (slug, name, brand, category_id, price_cents,
                         compare_cents, stock, summary, description, specs, badge, featured,
                         active, created_at)
                       VALUES (:slug, :name, :brand, :category_id, :price_cents, :compare_cents,
                         :stock, :summary, :description, :specs, :badge, :featured, :active, :ts)""",
                    {**data, "ts": now()})
                flash("Produit créé.", "success")
            else:
                execute(
                    """UPDATE products SET slug = :slug, name = :name, brand = :brand,
                         category_id = :category_id, price_cents = :price_cents,
                         compare_cents = :compare_cents, stock = :stock, summary = :summary,
                         description = :description, specs = :specs, badge = :badge,
                         featured = :featured, active = :active WHERE id = :id""",
                    {**data, "id": pid})
                flash("Produit mis à jour.", "success")
            return redirect(url_for("admin_products"))

        return render_template("admin/produit_form.html", p=p, form=product_form_values(p),
                               cats=query("SELECT * FROM categories ORDER BY rank"))

    @app.post("/admin/produits/<int:pid>/etat")
    def admin_product_toggle(pid: int):
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        p = query("SELECT active, name FROM products WHERE id = ?", (pid,), one=True)
        if p is None:
            abort(404)
        execute("UPDATE products SET active = ? WHERE id = ?", (0 if p["active"] else 1, pid))
        flash(f"{p['name']} {'retiré de' if p['active'] else 'remis en'} vente.", "info")
        return redirect(request.form.get("retour") or url_for("admin_products"))

    @app.get("/admin/commandes")
    def admin_orders():
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        status = request.args.get("statut") or ""
        sql = """SELECT o.*, u.email, u.name AS client,
                        (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS lines
                 FROM orders o JOIN users u ON u.id = o.user_id"""
        args = ()
        if status in ORDER_STATUSES:
            sql += " WHERE o.status = ?"
            args = (status,)
        orders = query(sql + " ORDER BY o.created_at DESC, o.id DESC", args)
        return render_template("admin/commandes.html", orders=orders, status=status)

    @app.post("/admin/commandes/<int:oid>/statut")
    def admin_order_status(oid: int):
        redirect_needed = require_admin()
        if redirect_needed:
            return redirect_needed
        status = request.form.get("status") or ""
        if status not in ORDER_STATUSES:
            abort(400)
        if query("SELECT 1 FROM orders WHERE id = ?", (oid,), one=True) is None:
            abort(404)
        execute("UPDATE orders SET status = ? WHERE id = ?", (status, oid))
        flash(f"Commande passée à « {status} ».", "success")
        return redirect(request.form.get("retour") or url_for("admin_orders"))

    # ------------------------------- divers --------------------------------- #

    @app.get("/api/etat")
    def api_state():
        row = query(
            """SELECT (SELECT COUNT(*) FROM products WHERE active = 1) AS products,
                      (SELECT COUNT(*) FROM users) AS users,
                      (SELECT COUNT(*) FROM orders) AS orders""", one=True)
        return jsonify({"boutique": app.config["SHOP_NAME"], "etat": "ok", **dict(row)})

    @app.errorhandler(400)
    def _e400(err):
        return render_template("erreur.html", code=400, titre="Requête refusée",
                               detail=getattr(err, "description", "")), 400

    @app.errorhandler(403)
    def _e403(_e):
        return render_template("erreur.html", code=403, titre="Accès refusé",
                               detail="Cette page est réservée à l'administration."), 403

    @app.errorhandler(404)
    def _e404(_e):
        return render_template("erreur.html", code=404, titre="Page introuvable",
                               detail="Le lien est peut-être obsolète."), 404


# --------------------------------------------------------------------------- #
# Écritures métier
# --------------------------------------------------------------------------- #

def place_order(user, view: dict, form: dict) -> str | None:
    """Enregistre la commande et décrémente le stock, en une transaction.

    Renvoie la référence, ou None si le stock ne suffit plus.
    """
    db = get_db()
    ref = "TW-" + now()[:10].replace("-", "") + "-" + secrets.token_hex(3).upper()
    try:
        db.execute("BEGIN IMMEDIATE")
        for line in view["lines"]:
            p = line["product"]
            cur = db.execute(
                "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ? AND active = 1",
                (line["qty"], p["id"], line["qty"]))
            if cur.rowcount != 1:
                db.rollback()
                return None
        cur = db.execute(
            """INSERT INTO orders (reference, user_id, status, subtotal_cents, shipping_cents,
                 total_cents, email, ship_name, ship_address, ship_zip, ship_city,
                 ship_country, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (ref, user["id"], ORDER_STATUSES[0], view["subtotal"], view["shipping"],
             view["total"], user["email"], form["ship_name"], form["ship_address"],
             form["ship_zip"], form["ship_city"], form["ship_country"], now()))
        oid = cur.lastrowid
        db.executemany(
            """INSERT INTO order_items (order_id, product_id, name, slug, unit_price_cents, qty)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [(oid, l["product"]["id"], l["product"]["name"], l["product"]["slug"],
              l["product"]["price_cents"], l["qty"]) for l in view["lines"]])
        db.execute("DELETE FROM cart_items WHERE user_id = ?", (user["id"],))
        db.commit()
    except Exception:
        db.rollback()
        raise
    session.pop("cart", None)
    return ref


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def product_form_values(p) -> dict:
    """Prépare les valeurs du formulaire produit (prix en euros décimaux)."""
    if p is None:
        return {"brand": "Trueware", "stock": "0", "active": 1}
    data = dict(p)
    data["price"] = f"{p['price_cents'] / 100:.2f}"
    data["compare"] = f"{p['compare_cents'] / 100:.2f}" if p["compare_cents"] else ""
    return data


def read_product_form(form, pid: int | None) -> tuple[dict, list[str]]:
    """Valide le formulaire produit de l'administration."""
    errors: list[str] = []

    def money(field: str, label: str, required: bool = True):
        raw = (form.get(field) or "").strip().replace(",", ".")
        if not raw:
            if required:
                errors.append(f"{label} requis.")
            return None
        try:
            value = round(float(raw) * 100)
        except ValueError:
            errors.append(f"{label} invalide.")
            return None
        if value < 0:
            errors.append(f"{label} doit être positif.")
            return None
        return value

    slug = (form.get("slug") or "").strip().lower()
    name = (form.get("name") or "").strip()
    if not SLUG_RE.match(slug):
        errors.append("Identifiant d'URL invalide : minuscules, chiffres et tirets seulement.")
    else:
        clash = query("SELECT id FROM products WHERE slug = ?", (slug,), one=True)
        if clash and clash["id"] != pid:
            errors.append("Cet identifiant d'URL est déjà utilisé.")
    if not 2 <= len(name) <= 120:
        errors.append("Le nom doit contenir entre 2 et 120 caractères.")

    try:
        cat_id = int(form.get("category_id", 0))
    except ValueError:
        cat_id = 0
    if not query("SELECT 1 FROM categories WHERE id = ?", (cat_id,), one=True):
        errors.append("Catégorie inconnue.")

    price = money("price", "Prix")
    compare = money("compare", "Prix barré", required=False)
    if price is not None and compare is not None and compare <= price:
        errors.append("Le prix barré doit être supérieur au prix de vente.")

    try:
        stock = int(form.get("stock", 0))
        if stock < 0:
            raise ValueError
    except ValueError:
        stock = 0
        errors.append("Stock invalide.")

    return {
        "slug": slug, "name": name,
        "brand": (form.get("brand") or "Trueware").strip()[:60],
        "category_id": cat_id, "price_cents": price or 0, "compare_cents": compare,
        "stock": stock,
        "summary": (form.get("summary") or "").strip()[:300],
        "description": (form.get("description") or "").strip()[:4000],
        "specs": (form.get("specs") or "").strip()[:2000],
        "badge": (form.get("badge") or "").strip()[:40],
        "featured": 1 if form.get("featured") else 0,
        "active": 1 if form.get("active") else 0,
    }, errors


if __name__ == "__main__":
    application = create_app()
    application.run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", 5001)),
        debug=os.environ.get("FLASK_DEBUG") == "1",
    )
