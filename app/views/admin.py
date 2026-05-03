# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：admin.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Article, Category, Tag, Series
from slugify import slugify

admin = Blueprint('admin', __name__)


@admin.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('admin.dashboard'))
        flash('用户名或密码错误', 'error')
    return render_template('admin/login.html')


@admin.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@admin.route('/')
@login_required
def dashboard():
    article_count = Article.query.count()
    published_count = Article.query.filter_by(is_published=True).count()
    category_count = Category.query.count()
    tag_count = Tag.query.count()
    return render_template('admin/dashboard.html',
                           article_count=article_count,
                           published_count=published_count,
                           category_count=category_count,
                           tag_count=tag_count)


@admin.route('/articles')
@login_required
def articles():
    page = request.args.get('page', 1, type=int)
    search_q = request.args.get('q', '')
    filter_cat = request.args.get('cat', '')

    query = Article.query
    if search_q:
        query = query.filter(
            Article.title.contains(search_q) | Article.slug.contains(search_q)
        )
    if filter_cat:
        query = query.join(Category).filter(Category.name == filter_cat)

    pagination = query.order_by(Article.created_at.desc()).paginate(page=page, per_page=20)
    categories = Category.query.all()

    return render_template('admin/articles.html',
                           articles=pagination.items,
                           pagination=pagination,
                           categories=categories,
                           search_q=search_q,
                           filter_cat=filter_cat)


@admin.route('/articles/new', methods=['GET', 'POST'])
@login_required
def article_new():
    if request.method == 'POST':
        return _save_article(None)
    categories = Category.query.all()
    tags = Tag.query.all()
    series_list = Series.query.all()
    return render_template('admin/article_form.html',
                           article=None,
                           categories=categories,
                           all_tags=tags,
                           series_list=series_list,
                           form_errors=None)


@admin.route('/articles/<int:article_id>/edit', methods=['GET', 'POST'])
@login_required
def article_edit(article_id):
    article = Article.query.get_or_404(article_id)
    if request.method == 'POST':
        return _save_article(article)
    categories = Category.query.all()
    tags = Tag.query.all()
    series_list = Series.query.all()
    return render_template('admin/article_form.html',
                           article=article,
                           categories=categories,
                           all_tags=tags,
                           series_list=series_list,
                           form_errors=None)


@admin.route('/articles/<int:article_id>/delete', methods=['POST'])
@login_required
def article_delete(article_id):
    article = Article.query.get_or_404(article_id)
    db.session.delete(article)
    db.session.commit()
    flash('文章已删除', 'success')
    return redirect(url_for('admin.articles'))


@admin.route('/articles/save/<int:article_id>', methods=['POST'])
@login_required
def article_save(article_id):
    article = Article.query.get(article_id) if article_id else None
    return _save_article(article)


def _save_article(article):
    title = request.form.get('title', '').strip()
    slug = slugify(request.form.get('slug', '').strip() or title)
    summary = request.form.get('summary', '').strip()
    content = request.form.get('body', '').strip()
    action = request.form.get('action', 'publish')
    is_published = action == 'publish'
    is_recommended = bool(request.form.get('featured'))
    series_id = request.form.get('series') or None

    # 处理分类
    cat_name = request.form.get('category', '').strip()
    category = Category.query.filter_by(name=cat_name).first() if cat_name else None

    # 处理标签
    tag_names = [t.strip() for t in request.form.get('tags', '').split(',') if t.strip()]
    tags = []
    for name in tag_names:
        tag = Tag.query.filter_by(name=name).first()
        if not tag:
            tag = Tag(name=name, slug=slugify(name))
            db.session.add(tag)
        tags.append(tag)

    if article is None:
        article = Article(
            title=title,
            slug=slug,
            summary=summary,
            content=content,
            is_published=is_published,
            is_recommended=is_recommended,
            category_id=category.id if category else None,
            series_id=series_id,
        )
        db.session.add(article)
    else:
        article.title = title
        article.slug = slug
        article.summary = summary
        article.content = content
        article.is_published = is_published
        article.is_recommended = is_recommended
        article.category_id = category.id if category else None
        article.series_id = series_id

    article.tags = tags
    db.session.commit()
    flash('文章已保存', 'success')
    return redirect(url_for('admin.articles'))