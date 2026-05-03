# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：blog.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, abort, request
from app import db
from app.models import Article, Category, Tag, Series
from app import cache
from app.utils import render_markdown

blog = Blueprint('blog', __name__)

@blog.route('/')
@cache.cached(timeout=300)
def index():
    page = request.args.get('page', 1, type=int)
    pagination = Article.query.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    return render_template('post_list.html', posts=pagination.items, pagination=pagination)

@blog.route('/<slug>')
def article_detail(slug):
    article = Article.query.filter_by(slug=slug, is_published=True).first_or_404()
    article.view_count += 1
    db.session.commit()
    content_html, toc_html = render_markdown(article.content)
    prev_post = Article.query.filter(
        Article.is_published==True,
        Article.created_at < article.created_at
    ).order_by(Article.created_at.desc()).first()
    next_post = Article.query.filter(
        Article.is_published==True,
        Article.created_at > article.created_at
    ).order_by(Article.created_at.asc()).first()
    return render_template('post_detail.html',
                           post=article,
                           content_html=content_html,
                           toc_html=toc_html,
                           prev_post=prev_post,
                           next_post=next_post)

@blog.route('/category/<slug>')
@cache.cached(timeout=300)
def category(slug):
    category = Category.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = category.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    return render_template('blog/category.html', category=category, pagination=pagination)

@blog.route('/tag/<slug>')
@cache.cached(timeout=300)
def tag(slug):
    tag = Tag.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = tag.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    return render_template('blog/tag.html', tag=tag, pagination=pagination)

@blog.route('/series/<slug>')
@cache.cached(timeout=300)
def series(slug):
    series = Series.query.filter_by(slug=slug).first_or_404()
    return render_template('blog/series.html', series=series)