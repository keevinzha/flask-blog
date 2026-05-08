# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 15:57
@Auth ： keevinzha
@File ：article.py
@IDE ：PyCharm
"""
from app import db
from app.models.tag import article_tags

class Article(db.Model):
    __tablename__ = 'articles'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    slug = db.Column(db.String(256), unique=True, nullable=False)
    summary = db.Column(db.String(512))
    content = db.Column(db.Text, nullable=False)
    cover = db.Column(db.String(256))
    view_count = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=False)
    is_recommended = db.Column(db.Boolean, default=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    series_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=True)
    series_order = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    theme = db.Column(db.String(64), nullable=True)

    tags = db.relationship('Tag', secondary=article_tags, backref=db.backref('articles', lazy='dynamic'))