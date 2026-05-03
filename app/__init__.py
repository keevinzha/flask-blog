from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_caching import Cache
from config import config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
cache = Cache()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)

    @app.context_processor
    def inject_globals():
        from app.models import Category, Tag
        return dict(
            site_title='猫窝',
            site_logo=None,
            nav_items=[
                {'title': '首页', 'url': '/'},
                {'title': '所有文章', 'url': '/blog'},
                {'title': '关于', 'url': '/about'},
            ],
            copyright='2026 © keevinzha'
        )

    from app.views.main import main as main_blueprint
    from app.views.blog import blog as blog_blueprint
    from app.views.admin import admin as admin_blueprint

    app.register_blueprint(main_blueprint)
    app.register_blueprint(blog_blueprint, url_prefix='/blog')
    app.register_blueprint(admin_blueprint, url_prefix='/admin')

    return app