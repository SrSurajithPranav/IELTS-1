from app import create_app
from models.db import db
from models.user import User
from werkzeug.security import generate_password_hash
import os

app = create_app()

with app.app_context():
    db.create_all()

    user = User(
        name="Admin",
        email="admin@test.com",
        password=generate_password_hash(os.environ["ADMIN_PASSWORD"]),
        role="admin"
    )

    db.session.add(user)
    db.session.commit()

    print("Admin created!")