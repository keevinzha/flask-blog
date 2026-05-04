# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：blog.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, request
from app import db
from app.models import Article, Category, Tag, Series
from app import cache
from app.utils import render_markdown

blog = Blueprint('blog', __name__)


def get_sidebar():
    return Category.query.all(), Tag.query.all()


@blog.route('/')
@cache.cached(timeout=300, query_string=True)
def index():
    page = request.args.get('page', 1, type=int)
    pagination = Article.query.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags)


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
    categories, tags = get_sidebar()
    return render_template('post_detail.html',
                           post=article,
                           content_html=content_html,
                           toc_html=toc_html,
                           prev_post=prev_post,
                           next_post=next_post,
                           all_categories=categories,
                           all_tags=tags)


@blog.route('/category/<slug>')
@cache.cached(timeout=300, query_string=True)
def category(slug):
    cat = Category.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = cat.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_category=cat)


@blog.route('/tag/<slug>')
@cache.cached(timeout=300, query_string=True)
def tag(slug):
    t = Tag.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = t.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_tag=t.name)


@blog.route('/series/<slug>')
@cache.cached(timeout=300, query_string=True)
def series(slug):
    s = Series.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = s.articles.filter_by(is_published=True)\
        .order_by(Article.series_order.asc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_series=s)