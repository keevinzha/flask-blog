from app import db
from datetime import date


class ArticleActivity(db.Model):
    __tablename__ = 'article_activities'

    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('article_id', 'date', name='uq_article_date'),
    )

    @staticmethod
    def record(article_id):
        """记录今天对该文章有过活动，已存在则忽略。"""
        today = date.today()
        exists = ArticleActivity.query.filter_by(article_id=article_id, date=today).first()
        if not exists:
            db.session.add(ArticleActivity(article_id=article_id, date=today))
