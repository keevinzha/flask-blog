# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/4 08:31
@Auth ： keevinzha
@File ：about.py
@IDE ：PyCharm
"""
from app import db

class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    author = db.Column(db.String(64))
    cover = db.Column(db.String(256))
    url = db.Column(db.String(256))
    note_article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=True)
    note_article = db.relationship('Article', backref='book', foreign_keys=[note_article_id])
    is_reading = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    url = db.Column(db.String(256))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())