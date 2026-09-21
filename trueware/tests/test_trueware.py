"""Tests de bout en bout de la boutique Trueware."""
from trueware.db import query

from .conftest import ADMIN, add_to_cart, login, register, token

KEYBOARD = "clavier-norvik-k87-tactile"


def pid(app, slug):
    with app.app_context():
        return query("SELECT id FROM products WHERE slug = ?", (slug,), one=True)["id"]


def stock(app, slug):
    with app.app_context():
        return query("SELECT stock FROM products WHERE slug = ?", (slug,), one=True)["stock"]


# ------------------------------------------------------------------ vitrine

def test_pages_publiques(client):
    for path in ["/", "/catalogue", f"/produit/{KEYBOARD}", "/panier",
                 "/connexion", "/inscription"]:
        assert client.get(path).status_code == 200, path


def test_accueil_liste_des_produits(client):
    body = client.get("/").data.decode()
    assert "Clavier Norvik K87 Tactile" in body
    assert "trueware" in body.lower()


def test_fiche_produit_affiche_prix_et_specs(client):
    body = client.get(f"/produit/{KEYBOARD}").data.decode()
    assert "139,00" in body          # 13900 centimes
    assert "87 touches (TKL)" in body  # ligne de caractéristiques
    assert "Aluminium 6063" in body


def test_produit_inconnu_renvoie_404(client):
    assert client.get("/produit/nexiste-pas").status_code == 404


def test_recherche_et_filtre(client):
    body = client.get("/catalogue?q=norvik").data.decode()
    assert "Clavier Norvik K87 Tactile" in body
    assert "Carte graphique Kaido RX 980" not in body

    body = client.get("/catalogue?categorie=ecrans").data.decode()
    assert "Écran Lumea 27" in body
    assert "Souris Axelon Pulse 8K" not in body

    assert "Aucun produit ne correspond" in client.get("/catalogue?q=zzzz").data.decode()


def test_tri_par_prix_croissant(client):
    body = client.get("/catalogue?tri=prix-croissant").data.decode()
    # le tapis (29 €) est le moins cher du catalogue
    assert body.index("Tapis Trueware Grid XL") < body.index("Carte graphique Kaido RX 980") \
        if "Carte graphique Kaido RX 980" in body else True
    assert "Tapis Trueware Grid XL" in body


def test_api_etat(client):
    data = client.get("/api/etat").get_json()
    assert data["etat"] == "ok"
    assert data["boutique"] == "Trueware"
    assert data["products"] == 26


# ------------------------------------------------------- inscription / connexion

def test_inscription_puis_connexion_puis_deconnexion(client):
    body = register(client).data.decode()
    assert "Bienvenue Alice Martin" in body
    assert "Mes commandes" in body            # on est sur la page compte

    client.post("/deconnexion", data={"csrf_token": token(client)}, follow_redirects=True)
    assert client.get("/compte", follow_redirects=False).status_code == 302

    assert "Content de vous revoir" in login(client).data.decode()


def test_inscription_refuse_donnees_invalides(client):
    short = client.post("/inscription", data={
        "name": "Bob", "email": "bob@example.com", "password": "court",
        "password2": "court", "csrf_token": token(client)}, follow_redirects=True)
    assert "au moins 8 caractères" in short.data.decode()

    mismatch = client.post("/inscription", data={
        "name": "Bob", "email": "bob@example.com", "password": "motdepasse1",
        "password2": "motdepasse2", "csrf_token": token(client)}, follow_redirects=True)
    assert "ne correspondent pas" in mismatch.data.decode()

    bad_mail = client.post("/inscription", data={
        "name": "Bob", "email": "pas-un-email", "password": "motdepasse1",
        "password2": "motdepasse1", "csrf_token": token(client)}, follow_redirects=True)
    assert "invalide" in bad_mail.data.decode()


def test_inscription_refuse_un_email_deja_pris(client, app):
    register(client)
    client.post("/deconnexion", data={"csrf_token": token(client)})
    again = register(client, name="Autre Personne")
    assert "existe déjà" in again.data.decode()
    with app.app_context():
        assert query("SELECT COUNT(*) AS n FROM users WHERE email = ?",
                     ("client@example.com",), one=True)["n"] == 1


def test_connexion_refuse_un_mauvais_mot_de_passe(client):
    register(client)
    client.post("/deconnexion", data={"csrf_token": token(client)})
    body = login(client, password="mauvais-mot-de-passe").data.decode()
    assert "incorrect" in body


def test_mot_de_passe_est_hache(client, app):
    register(client, password="motdepasse-secret-1")
    with app.app_context():
        row = query("SELECT password_hash FROM users WHERE email = ?",
                    ("client@example.com",), one=True)
    assert "motdepasse-secret-1" not in row["password_hash"]
    assert row["password_hash"].startswith(("pbkdf2:", "scrypt:"))


def test_limitation_des_tentatives_de_connexion(client):
    register(client)
    client.post("/deconnexion", data={"csrf_token": token(client)})
    for _ in range(10):
        login(client, password="faux")
    blocked = client.post("/connexion",
                          data={"email": "client@example.com", "password": "motdepasse1",
                                "csrf_token": token(client)})
    assert blocked.status_code == 429
    assert "Trop de tentatives" in blocked.data.decode()


def test_redirection_apres_connexion_reste_interne(client):
    register(client)
    client.post("/deconnexion", data={"csrf_token": token(client)})
    resp = login(client, suivant="https://exemple-malveillant.test/")
    assert "exemple-malveillant" not in resp.data.decode()


def test_csrf_obligatoire(client):
    resp = client.post("/inscription", data={
        "name": "Sans Jeton", "email": "sans@example.com",
        "password": "motdepasse1", "password2": "motdepasse1"})
    assert resp.status_code == 400


# ------------------------------------------------------------------- panier

def test_ajout_au_panier_visiteur(client, app):
    add_to_cart(client, pid(app, KEYBOARD), 2)
    body = client.get("/panier").data.decode()
    assert "Clavier Norvik K87 Tactile" in body
    assert "2 articles" in body


def test_panier_visiteur_fusionne_a_la_connexion(client, app):
    register(client)
    client.post("/deconnexion", data={"csrf_token": token(client)})
    add_to_cart(client, pid(app, KEYBOARD), 3)
    login(client)
    with app.app_context():
        rows = query("SELECT qty FROM cart_items")
    assert [r["qty"] for r in rows] == [3]


def test_panier_borne_par_le_stock(client, app):
    with app.app_context():
        from trueware.db import execute
        execute("UPDATE products SET stock = 2 WHERE slug = ?", (KEYBOARD,))
    # le message d'avertissement apparaît dans la réponse de l'ajout lui-même
    added = add_to_cart(client, pid(app, KEYBOARD), 9).data.decode()
    assert "Stock disponible : 2" in added
    assert "2 articles" in client.get("/panier").data.decode()


def test_produit_en_rupture_non_ajoutable(client, app):
    with app.app_context():
        from trueware.db import execute
        execute("UPDATE products SET stock = 0 WHERE slug = ?", (KEYBOARD,))
    body = add_to_cart(client, pid(app, KEYBOARD)).data.decode()
    assert "rupture de stock" in body
    assert "Votre panier est vide" in client.get("/panier").data.decode()


def test_retrait_du_panier(client, app):
    add_to_cart(client, pid(app, KEYBOARD))
    body = client.post("/panier/modifier", data={
        "product_id": pid(app, KEYBOARD), "action": "supprimer",
        "csrf_token": token(client)}, follow_redirects=True).data.decode()
    assert "Votre panier est vide" in body


def test_livraison_offerte_au_dela_du_seuil(client, app):
    add_to_cart(client, pid(app, "tapis-trueware-grid-xl"))     # 29 €
    assert "4,90" in client.get("/panier").data.decode()
    add_to_cart(client, pid(app, KEYBOARD))                      # +139 €
    assert "Offerte" in client.get("/panier").data.decode()


# ----------------------------------------------------------------- commande

def test_commande_exige_connexion(client, app):
    add_to_cart(client, pid(app, KEYBOARD))
    resp = client.get("/commande")
    assert resp.status_code == 302
    assert "/connexion" in resp.headers["Location"]


def test_commande_cree_la_commande_et_decremente_le_stock(client, app):
    before = stock(app, KEYBOARD)
    register(client)
    add_to_cart(client, pid(app, KEYBOARD), 2)
    body = client.post("/commande", data={
        "ship_name": "Alice Martin", "ship_address": "12 rue des Lilas",
        "ship_zip": "75011", "ship_city": "Paris", "ship_country": "France",
        "csrf_token": token(client)}, follow_redirects=True).data.decode()

    assert "Merci" in body and "TW-" in body
    assert stock(app, KEYBOARD) == before - 2
    with app.app_context():
        order = query("SELECT * FROM orders", one=True)
        items = query("SELECT * FROM order_items WHERE order_id = ?", (order["id"],))
        assert query("SELECT COUNT(*) AS n FROM cart_items", one=True)["n"] == 0
    assert order["subtotal_cents"] == 2 * 13900
    assert order["shipping_cents"] == 0          # au-delà de 100 €
    assert order["total_cents"] == 2 * 13900
    assert order["status"] == "En préparation"
    assert len(items) == 1 and items[0]["qty"] == 2


def test_commande_refuse_une_adresse_incomplete(client, app):
    register(client)
    add_to_cart(client, pid(app, KEYBOARD))
    body = client.post("/commande", data={
        "ship_name": "", "ship_address": "", "ship_zip": "", "ship_city": "",
        "ship_country": "France", "csrf_token": token(client)},
        follow_redirects=True).data.decode()
    assert "Adresse requise" in body
    with app.app_context():
        assert query("SELECT COUNT(*) AS n FROM orders", one=True)["n"] == 0


def test_commande_vide_renvoie_au_catalogue(client):
    register(client)
    resp = client.get("/commande", follow_redirects=True)
    assert "panier est vide" in resp.data.decode()


def test_commande_invisible_pour_un_autre_client(client, app):
    register(client)
    add_to_cart(client, pid(app, KEYBOARD))
    client.post("/commande", data={
        "ship_name": "Alice", "ship_address": "12 rue des Lilas", "ship_zip": "75011",
        "ship_city": "Paris", "ship_country": "France", "csrf_token": token(client)})
    with app.app_context():
        ref = query("SELECT reference FROM orders", one=True)["reference"]

    client.post("/deconnexion", data={"csrf_token": token(client)})
    register(client, email="intrus@example.com", name="Bob Curieux")
    assert client.get(f"/commande/{ref}").status_code == 403


def test_historique_des_commandes_sur_le_compte(client, app):
    register(client)
    add_to_cart(client, pid(app, KEYBOARD))
    client.post("/commande", data={
        "ship_name": "Alice", "ship_address": "12 rue des Lilas", "ship_zip": "75011",
        "ship_city": "Paris", "ship_country": "France", "csrf_token": token(client)})
    assert "TW-" in client.get("/compte").data.decode()


# --------------------------------------------------------------------- avis

def test_avis_exige_une_connexion(client, app):
    resp = client.post(f"/produit/{KEYBOARD}/avis",
                       data={"rating": 5, "body": "Excellent", "csrf_token": token(client)})
    assert resp.status_code == 302
    assert "/connexion" in resp.headers["Location"]


def test_avis_publie_puis_mis_a_jour(client, app):
    register(client)
    client.post(f"/produit/{KEYBOARD}/avis",
                data={"rating": 5, "body": "Frappe très agréable.", "csrf_token": token(client)})
    body = client.get(f"/produit/{KEYBOARD}").data.decode()
    assert "Frappe très agréable." in body
    assert "1 avis client" in body

    client.post(f"/produit/{KEYBOARD}/avis",
                data={"rating": 3, "body": "Finalement un peu bruyant.",
                      "csrf_token": token(client)})
    with app.app_context():
        rows = query("SELECT rating, body FROM reviews")
    assert len(rows) == 1 and rows[0]["rating"] == 3


def test_avis_refuse_une_note_hors_bornes(client, app):
    register(client)
    body = client.post(f"/produit/{KEYBOARD}/avis",
                       data={"rating": 9, "body": "", "csrf_token": token(client)},
                       follow_redirects=True).data.decode()
    assert "entre 1 et 5" in body
    with app.app_context():
        assert query("SELECT COUNT(*) AS n FROM reviews", one=True)["n"] == 0


# ----------------------------------------------------------- administration

def test_admin_refuse_un_visiteur(client):
    resp = client.get("/admin")
    assert resp.status_code == 302 and "/connexion" in resp.headers["Location"]


def test_admin_refuse_un_client_simple(client):
    register(client)
    assert client.get("/admin").status_code == 403
    assert client.get("/admin/produits").status_code == 403
    assert client.get("/admin/commandes").status_code == 403


def test_admin_accede_au_tableau_de_bord(client):
    login(client, *ADMIN)
    body = client.get("/admin").data.decode()
    assert "Tableau de bord" in body
    assert "Comptes clients" in body


def test_admin_cree_un_produit(client, app):
    login(client, *ADMIN)
    with app.app_context():
        cat = query("SELECT id FROM categories WHERE slug = 'audio'", one=True)["id"]
    client.post("/admin/produits/nouveau", data={
        "name": "Casque Solen Test", "slug": "casque-solen-test", "brand": "Solen",
        "category_id": cat, "price": "199,90", "compare": "249,00", "stock": "5",
        "summary": "Un casque de test.", "description": "Description de test.",
        "specs": "Type|Fermé", "badge": "", "active": "on",
        "csrf_token": token(client)}, follow_redirects=True)
    with app.app_context():
        p = query("SELECT * FROM products WHERE slug = 'casque-solen-test'", one=True)
    assert p is not None
    assert p["price_cents"] == 19990 and p["compare_cents"] == 24900
    assert client.get("/produit/casque-solen-test").status_code == 200


def test_admin_refuse_un_slug_deja_pris(client, app):
    login(client, *ADMIN)
    with app.app_context():
        cat = query("SELECT id FROM categories WHERE slug = 'audio'", one=True)["id"]
    body = client.post("/admin/produits/nouveau", data={
        "name": "Doublon", "slug": KEYBOARD, "category_id": cat,
        "price": "10", "stock": "1", "active": "on",
        "csrf_token": token(client)}, follow_redirects=True).data.decode()
    assert "déjà utilisé" in body


def test_admin_modifie_un_produit(client, app):
    login(client, *ADMIN)
    target = pid(app, KEYBOARD)
    with app.app_context():
        row = query("SELECT * FROM products WHERE id = ?", (target,), one=True)
    client.post(f"/admin/produits/{target}", data={
        "name": row["name"], "slug": row["slug"], "brand": row["brand"],
        "category_id": row["category_id"], "price": "129,00", "compare": "169,00",
        "stock": "7", "summary": row["summary"], "description": row["description"],
        "specs": row["specs"], "badge": "Promo", "active": "on", "featured": "on",
        "csrf_token": token(client)}, follow_redirects=True)
    with app.app_context():
        after = query("SELECT * FROM products WHERE id = ?", (target,), one=True)
    assert after["price_cents"] == 12900 and after["stock"] == 7
    assert after["badge"] == "Promo"


def test_admin_retire_un_produit_de_la_vente(client, app):
    login(client, *ADMIN)
    target = pid(app, KEYBOARD)
    client.post(f"/admin/produits/{target}/etat",
                data={"csrf_token": token(client)}, follow_redirects=True)
    assert stock(app, KEYBOARD) >= 0
    assert client.get(f"/produit/{KEYBOARD}").status_code == 404
    assert "Clavier Norvik K87" not in client.get("/catalogue").data.decode()


def test_admin_change_le_statut_d_une_commande(client, app):
    register(client)
    add_to_cart(client, pid(app, KEYBOARD))
    client.post("/commande", data={
        "ship_name": "Alice", "ship_address": "12 rue des Lilas", "ship_zip": "75011",
        "ship_city": "Paris", "ship_country": "France", "csrf_token": token(client)})
    client.post("/deconnexion", data={"csrf_token": token(client)})

    login(client, *ADMIN)
    with app.app_context():
        oid = query("SELECT id FROM orders", one=True)["id"]
    client.post(f"/admin/commandes/{oid}/statut",
                data={"status": "Expédiée", "csrf_token": token(client)}, follow_redirects=True)
    with app.app_context():
        assert query("SELECT status FROM orders WHERE id = ?", (oid,), one=True)["status"] == "Expédiée"


def test_admin_refuse_un_statut_inconnu(client, app):
    register(client)
    add_to_cart(client, pid(app, KEYBOARD))
    client.post("/commande", data={
        "ship_name": "Alice", "ship_address": "12 rue des Lilas", "ship_zip": "75011",
        "ship_city": "Paris", "ship_country": "France", "csrf_token": token(client)})
    client.post("/deconnexion", data={"csrf_token": token(client)})
    login(client, *ADMIN)
    with app.app_context():
        oid = query("SELECT id FROM orders", one=True)["id"]
    assert client.post(f"/admin/commandes/{oid}/statut",
                       data={"status": "Perdue", "csrf_token": token(client)}).status_code == 400


# --------------------------------------------------------------- en-têtes

def test_entetes_de_securite(client):
    h = client.get("/").headers
    assert h["X-Content-Type-Options"] == "nosniff"
    assert h["X-Frame-Options"] == "DENY"
    assert "default-src 'self'" in h["Content-Security-Policy"]
