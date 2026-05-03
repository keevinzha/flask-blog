# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：main.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template
from flask import jsonify, url_for
from app.models import Article
from app.models import Article, Category, Series
from app import cache

main = Blueprint('main', __name__)


@main.route('/')
@cache.cached(timeout=300)
def index():
    recommended = Article.query.filter_by(
        is_published=True, is_recommended=True
    ).order_by(Article.created_at.desc()).limit(6).all()

    recent = Article.query.filter_by(
        is_published=True
    ).order_by(Article.created_at.desc()).limit(10).all()

    categories = Category.query.all()
    series_list = Series.query.all()

    return render_template('post_list.html',
                           posts=recent,
                           pagination=None,
                           all_categories=categories,
                           all_tags=[])

@main.route('/search-data.json')
def search_data():
    posts = Article.query.filter_by(is_published=True).all()
    data = [
        {
            'title': p.title,
            'href': url_for('blog.article_detail', slug=p.slug),
            'content': p.summary or '',
            'section': p.category.name if p.category else '',
        }
        for p in posts
    ]
    return jsonify(data)