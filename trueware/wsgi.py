"""Point d'entrée WSGI : gunicorn trueware.wsgi:app"""
from . import create_app

app = create_app()
