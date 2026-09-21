"""Fixtures de test : une base SQLite neuve et isolée par test."""
import os

import pytest

# Doit être posé avant l'import de l'application : évite d'écrire une clé de
# session ou un mot de passe admin dans le dossier data/ du dépôt.
os.environ.setdefault("TRUEWARE_SECRET_KEY", "cle-de-test-non-secrete")
os.environ.setdefault("TRUEWARE_ADMIN_EMAIL", "admin@trueware.test")
os.environ.setdefault("TRUEWARE_ADMIN_PASSWORD", "admin-de-test-123")

from trueware import create_app  # noqa: E402
from trueware.app import _LOGIN_FAILS  # noqa: E402

ADMIN = ("admin@trueware.test", "admin-de-test-123")


@pytest.fixture
def app(tmp_path):
    os.environ["TRUEWARE_DATA_DIR"] = str(tmp_path)
    _LOGIN_FAILS.clear()
    return create_app({"DATABASE": str(tmp_path / "trueware-test.db"), "TESTING": True})


@pytest.fixture
def client(app):
    return app.test_client()


def token(client) -> str:
    """Jeton CSRF de la session courante (créé s'il n'existe pas encore)."""
    with client.session_transaction() as sess:
        if "csrf" not in sess:
            sess["csrf"] = "jeton-de-test"
        return sess["csrf"]


def register(client, email="client@example.com", password="motdepasse1", name="Alice Martin"):
    return client.post(
        "/inscription",
        data={"name": name, "email": email, "password": password,
              "password2": password, "csrf_token": token(client)},
        follow_redirects=True,
    )


def login(client, email="client@example.com", password="motdepasse1", **extra):
    data = {"email": email, "password": password, "csrf_token": token(client)}
    data.update(extra)
    return client.post("/connexion", data=data, follow_redirects=True)


def add_to_cart(client, product_id, qty=1):
    return client.post(
        "/panier/ajouter",
        data={"product_id": product_id, "qty": qty, "csrf_token": token(client)},
        follow_redirects=True,
    )
