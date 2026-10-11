"""Собрать презентацию «Полка»."""

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt
from lxml import etree

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 14

BG = RGBColor(0xF4, 0xEF, 0xE6)
INK = RGBColor(0x1C, 0x19, 0x15)
MUTED = RGBColor(0x5E, 0x56, 0x4A)
RED = RGBColor(0xC2, 0x41, 0x2D)
CARD = RGBColor(0xFF, 0xFC, 0xF6)
LINE = RGBColor(0xE0, 0xD6, 0xC4)
WHITE = RGBColor(0xFF, 0xFC, 0xF6)

prs = Presentation()
prs.slide_width = W
prs.slide_height = H
prs.core_properties.title = "Полка — отзывы на игры"
prs.core_properties.subject = "Проектный практикум"
prs.core_properties.author = "Иванов Никита Сергеевич"
BLANK = prs.slide_layouts[6]


def style_run(run, size, color, bold=False):
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    r_pr = run._r.get_or_add_rPr()
    for tag in ("latin", "ea", "cs"):
        node = r_pr.find(qn(f"a:{tag}"))
        if node is None:
            node = etree.SubElement(r_pr, qn(f"a:{tag}"))
        node.set("typeface", "Calibri")


def add_text(slide, left, top, width, height, text, size=20, color=INK, bold=False, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    frame = box.text_frame
    frame.word_wrap = True
    frame.auto_size = None
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    frame.margin_top = Emu(0)
    frame.margin_bottom = Emu(0)
    frame.paragraphs[0].alignment = align
    run = frame.paragraphs[0].add_run()
    run.text = text
    style_run(run, size, color, bold)
    return box


def add_lines(slide, left, top, width, height, lines, size=20, color=INK, bold=False, gap=10):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    frame = box.text_frame
    frame.word_wrap = True
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    frame.margin_top = Emu(0)
    frame.margin_bottom = Emu(0)
    for index, line in enumerate(lines):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = PP_ALIGN.LEFT
        paragraph.space_after = Pt(gap)
        run = paragraph.add_run()
        run.text = line
        style_run(run, size, color, bold)
    return box


def rect(slide, left, top, width, height, fill, line=None, rounded=False):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(kind, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)
    if rounded:
        shape.adjustments[0] = 0.08
    return shape


def chrome(slide, number):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG
    rect(slide, 0, 0, 0.1, 7.5, RED)
    add_text(slide, 0.48, 7.12, 8, 0.28, "Полка  ·  отзывы на игры", 13, MUTED)
    add_text(slide, 10.6, 7.12, 2.3, 0.28, f"{number}  /  {TOTAL}", 13, MUTED, align=PP_ALIGN.RIGHT)


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def kicker(slide, text):
    add_text(slide, 0.48, 0.28, 12, 0.28, text.upper(), 13, RED, True)


def title(slide, text, top=0.58, width=12.2):
    add_text(slide, 0.48, top, width, 0.85, text, 32, INK, True)


# 1
slide = prs.slides.add_slide(BLANK)
chrome(slide, 1)
add_text(slide, 0.48, 1.45, 10, 0.3, "ПРОЕКТНЫЙ ПРАКТИКУМ", 14, RED, True)
add_text(slide, 0.48, 1.9, 10, 1.2, "Полка", 72, INK, True)
add_text(slide, 0.5, 3.3, 9, 0.7, "Отзывы на игры. Оценку ставят люди на сайте.", 26, INK)
rect(slide, 0.5, 4.35, 2.2, 0.06, RED)
add_text(slide, 0.5, 4.65, 10, 0.4, "Иванов Никита Сергеевич", 24, INK, True)
add_text(slide, 0.5, 5.2, 8, 0.35, "Группа БПИ2304", 20, MUTED)
notes(
    slide,
    "Здравствуйте. Меня зовут Иванов Никита Сергеевич, группа БПИ2304. "
    "Проект называется «Полка». Это каталог отзывов на игры. "
    "Средняя оценка на карточке считается только по отзывам людей, которые зарегистрировались на сайте. "
    "Цифру из магазина я не подставляю.",
)

# 2. Проблемная область
slide = prs.slides.add_slide(BLANK)
chrome(slide, 2)
kicker(slide, "Проблемная область")
title(slide, "Оценка есть. Автора не видно.")
cards = [
    ("Магазин", "Одна цифра на тысячи голосов. Кто поставил балл, не видно."),
    ("Пример", "Hollow Knight: на Полке три отзыва с именами и средняя 9,0."),
    ("Зачем это", "Вечером человек выбирает игру и хочет два живых мнения, не толпу баллов."),
]
for index, (head, body) in enumerate(cards):
    left = 0.48 + index * 4.15
    rect(slide, left, 1.9, 3.95, 4.7, CARD, LINE, True)
    add_text(slide, left + 0.28, 2.15, 3.4, 0.4, f"0{index + 1}", 18, RED, True)
    add_text(slide, left + 0.28, 2.75, 3.4, 1.1, head, 26, INK, True)
    add_text(slide, left + 0.28, 4.05, 3.4, 2.1, body, 18, MUTED)
notes(
    slide,
    "Проблема: в магазине одна общая оценка, и по ней не понять, кому игра зашла. "
    "Пример из каталога: у Hollow Knight на Полке три отзыва с именами, средняя 9,0. "
    "Задача актуальна для человека, который вечером выбирает игру и хочет прочитать два-три отзыва, а не тысячу баллов.",
)

# 3. Предлагаемое решение
slide = prs.slides.add_slide(BLANK)
chrome(slide, 3)
kicker(slide, "Решение")
title(slide, "Среднюю считает сам сайт")
points = [
    ("1", "Один человек — один отзыв на игру. Оценка от 1 до 10."),
    ("2", "Свой текст можно исправить. Чужую карточку и чужой отзыв — нет."),
    ("3", "Каталог читается без входа. Писать отзыв и добавлять игру — после входа."),
]
for index, (num, text) in enumerate(points):
    top = 1.75 + index * 1.15
    rect(slide, 0.48, top, 12.35, 1.02, CARD, LINE, True)
    rect(slide, 0.68, top + 0.18, 0.66, 0.66, RED, rounded=True)
    add_text(slide, 0.68, top + 0.3, 0.66, 0.42, num, 20, WHITE, True, PP_ALIGN.CENTER)
    add_text(slide, 1.6, top + 0.28, 10.8, 0.5, text, 22, INK)
add_text(slide, 0.48, 5.3, 12.3, 0.35, "Что уже работает", 16, RED, True)
funcs = ["Поиск и фильтр", "Своя средняя", "Обложка игры", "Новинки и цена"]
for index, label in enumerate(funcs):
    left = 0.48 + index * 3.2
    rect(slide, left, 5.75, 3.02, 0.95, RGBColor(0x1C, 0x19, 0x15), rounded=True)
    add_text(slide, left, 6.0, 3.02, 0.45, label, 18, WHITE, True, PP_ALIGN.CENTER)
notes(
    slide,
    "Продукт — каталог «Полка». Среднюю считает сам сайт, не магазин. "
    "Один человек оставляет один отзыв на игру, оценка от 1 до 10. Своё можно исправить, чужое нельзя. "
    "Без входа каталог читается. После входа можно написать отзыв и добавить игру. "
    "Уже работают поиск, фильтр, своя средняя, обложка и страница новинок с ценой.",
)

# 4. Технологическая реализация: устройство и кто какой модуль собрал
slide = prs.slides.add_slide(BLANK)
chrome(slide, 4)
kicker(slide, "Технологическая реализация")
title(slide, "Три части")
parts = [
    ("Страницы", "Каталог, карточка, вход, форма отзыва, новинки.", "Иванов Н.С."),
    ("Сервер", "Вход, отзыв, новая игра. Пароль сверяется с хешем.", "Иванов Н.С."),
    ("База", "Файл SQLite: люди, игры, отзывы. Создаётся при запуске.", "Иванов Н.С."),
]
for index, (head, body, who) in enumerate(parts):
    left = 0.48 + index * 4.15
    rect(slide, left, 1.85, 3.95, 3.15, CARD, LINE, True)
    add_text(slide, left + 0.25, 2.05, 3.45, 0.5, head, 24, INK, True)
    add_text(slide, left + 0.25, 2.65, 3.45, 1.35, body, 16, MUTED)
    add_text(slide, left + 0.25, 4.25, 3.45, 0.4, who, 16, RED, True)
rect(slide, 0.48, 5.2, 12.35, 1.6, RGBColor(0x1C, 0x19, 0x15), rounded=True)
add_text(slide, 0.78, 5.4, 11.8, 0.35, "Откуда берётся новая игра", 16, RGBColor(0xE7, 0xC2, 0xB8), True)
add_text(
    slide,
    0.78,
    5.85,
    11.8,
    0.7,
    "Карточка — из RAWG или из запасного списка. Обложка — со страницы магазина, если игры там нет, с сайта студии.",
    18,
    WHITE,
)
notes(
    slide,
    "Система из трёх частей, все три собрал я, Иванов Никита Сергеевич. "
    "Страницы показывают каталог и формы. Сервер принимает вход, отзыв и новую игру, пароль хранится как хеш. "
    "База — один файл SQLite, он создаётся при первом запуске. "
    "Описание новой игры может прийти из RAWG. Если ключа нет, есть запасной список. "
    "Обложку сайт берёт со страницы магазина, а если игры там нет — с сайта студии.",
)

# 5. Стек. Магазины здесь не перечисляются: это не код проекта.
slide = prs.slides.add_slide(BLANK)
chrome(slide, 5)
kicker(slide, "Технологии")
title(slide, "Чем сделано")
chips = ["Next.js", "React", "TypeScript", "Tailwind", "SQLite", "Node.js"]
for index, chip in enumerate(chips):
    col = index % 3
    row = index // 3
    left = 0.48 + col * 4.2
    top = 1.9 + row * 1.55
    rect(slide, left, top, 3.95, 1.35, CARD, LINE, True)
    add_text(slide, left, top + 0.38, 3.95, 0.55, chip, 26, INK, True, PP_ALIGN.CENTER)
add_text(
    slide,
    0.48,
    5.2,
    12.3,
    0.7,
    "Это код сайта. Страницы, сервер, базу и проверку собрал Иванов Н.С.",
    20,
    MUTED,
)
add_text(slide, 0.48, 6.0, 12.3, 0.6, "Проверка — команда npm test, восемь автотестов.", 20, INK)
notes(
    slide,
    "На этом слайде только то, на чём написан сайт: Next.js, React, TypeScript, Tailwind, SQLite и Node.js. "
    "Магазины сюда не входят. Это источники картинок и ссылок, а не технологии проекта. "
    "Все модули собрал Иванов Никита Сергеевич. Проверка запускается командой npm test, автотестов восемь.",
)

# 6. Рынок, аудитория, отличие
slide = prs.slides.add_slide(BLANK)
chrome(slide, 6)
kicker(slide, "Рынок")
title(slide, "Для кого и чем отличается", top=0.52)
add_text(
    slide,
    0.48,
    1.5,
    12.3,
    0.55,
    "Аудитория: игрок, который вечером выбирает игру. Сначала свои, потом любой с аккаунтом.",
    18,
    INK,
)
rows = [
    ("Steam", "Магазин и толпа оценок"),
    ("Metacritic", "Критики и игроки в одной цифре"),
    ("RAWG", "База игр и картинки"),
    ("Полка", "Имя автора и своя средняя. Игры не продаёт."),
]
for index, (name, text) in enumerate(rows):
    top = 2.2 + index * 1.0
    fill = RGBColor(0x1C, 0x19, 0x15) if name == "Полка" else CARD
    name_color = WHITE if name == "Полка" else INK
    text_color = RGBColor(0xE7, 0xD7, 0xC4) if name == "Полка" else MUTED
    rect(slide, 0.48, top, 12.35, 0.88, fill, None if name == "Полка" else LINE, True)
    add_text(slide, 0.75, top + 0.2, 3.2, 0.48, name, 22, name_color, True)
    add_text(slide, 4.1, top + 0.2, 8.3, 0.48, text, 20, text_color)
notes(
    slide,
    "Целевая аудитория узкая: человек, который выбирает игру вечером. Сначала это свои, потом любой, кто зарегистрировался. "
    "Steam, Metacritic и RAWG уже закрывают магазин, общую оценку и большую базу. "
    "Отличие Полки: видно, кто написал отзыв, средняя считается здесь, и игры сайт не продаёт.",
)

# 7. Бизнес-модель. Платежей в прототипе нет, рекламный слайд не возвращаем.
slide = prs.slides.add_slide(BLANK)
chrome(slide, 7)
kicker(slide, "Бизнес-модель")
title(slide, "Балл не продаётся")
biz = [
    ("Сейчас", "Платежей нет. Это прототип для практикума, не касса."),
    ("Цена", "Чтение и отзыв ничего не стоят. Иначе оценку можно было бы купить."),
    ("Позже", "Можно сделать кабинет студии, чтобы читать отзывы своего круга. Этого ещё нет."),
]
for index, (head, body) in enumerate(biz):
    left = 0.48 + index * 4.15
    rect(slide, left, 1.95, 3.95, 4.55, CARD, LINE, True)
    add_text(slide, left + 0.28, 2.25, 3.4, 0.4, f"0{index + 1}", 18, RED, True)
    add_text(slide, left + 0.28, 2.9, 3.4, 0.8, head, 26, INK, True)
    add_text(slide, left + 0.28, 4.0, 3.4, 2.0, body, 18, MUTED)
notes(
    slide,
    "Бизнес-модель сейчас простая: сайт ничего не продаёт. Игры не продаются, оценка не продаётся. "
    "Чтение и отзыв бесплатны специально, чтобы балл нельзя было купить. "
    "Если продукт развивать, возможен кабинет для студии: читать отзывы своего круга. Этого в прототипе нет.",
)

# 8. Прототип
slide = prs.slides.add_slide(BLANK)
chrome(slide, 8)
kicker(slide, "Демонстрация")
title(slide, "Так это выглядит", top=0.42)
add_text(slide, 0.48, 1.28, 6.1, 0.28, "Каталог. Выше оценка — выше карточка.", 14, MUTED)
add_text(slide, 6.9, 1.28, 6, 0.28, "Hollow Knight. Средняя 9,0 по трём отзывам.", 14, MUTED)
slide.shapes.add_picture("presentation/screens/catalog.png", Inches(0.48), Inches(1.62), Inches(6.15), Inches(3.84))
slide.shapes.add_picture("presentation/screens/game.png", Inches(6.85), Inches(1.62), Inches(6.0), Inches(3.75))
add_text(
    slide,
    0.48,
    5.65,
    12.3,
    1.15,
    "Гость читает каталог без входа. Оценку ставит после входа. Экраны собрал Иванов Н.С.",
    18,
    MUTED,
)
notes(
    slide,
    "Показываю работающий прототип. На главной карточки с обложкой, жанром и оценкой. "
    "Disco Elysium первый, потому что здесь ему поставили 10. "
    "Hollow Knight: 9,0 по трём отзывам, у каждого есть имя. "
    "Эти экраны собрал Иванов Никита Сергеевич. Без входа можно читать, поставить оценку можно после входа.",
)

# 9. Сценарии демонстрации
slide = prs.slides.add_slide(BLANK)
chrome(slide, 9)
kicker(slide, "Демонстрация")
title(slide, "Что открыть", top=0.42)
steps = [
    "Фильтр «Платформер» — остаётся Celeste.",
    "Hollow Knight: оценка 9,0 и три отзыва с именами.",
    "Вход: demo@polka.local, пароль polka1234.",
    "«Добавить игру» — Cuphead. Обложка уже на карточке.",
    "Одна оценка. Сервер пересчитывает среднюю.",
    "Имя в шапке: свои игры и свои отзывы.",
]
for index, step in enumerate(steps):
    top = 1.45 + index * 0.78
    add_text(slide, 0.48, top, 0.5, 0.4, str(index + 1), 22, RED, True)
    add_text(slide, 1.1, top, 11.6, 0.55, step, 20, INK)
add_text(slide, 0.48, 6.25, 12.3, 0.5, "Сценарии и серверную часть собрал Иванов Н.С.", 18, RED, True)
notes(
    slide,
    "Этот слайд я не читаю целиком, а открываю сайт. "
    "Фильтр «Платформер» оставляет Celeste. На Hollow Knight три отзыва с именами. "
    "Вхожу как demo@polka.local, пароль polka1234. "
    "Добавляю Cuphead: обложка уже стоит. Ставлю одну оценку и показываю, что сервер пересчитал среднюю. "
    "В шапке открываю свои игры и свои отзывы. Всё это собрал я.",
)

# 10. Команда
slide = prs.slides.add_slide(BLANK)
chrome(slide, 10)
kicker(slide, "Команда")
title(slide, "Команда проекта")
add_text(slide, 0.48, 1.55, 12.3, 0.7, "Иванов Никита Сергеевич — разработчик", 26, INK, True)
add_text(slide, 0.48, 2.2, 12.3, 0.4, "Группа БПИ2304", 18, MUTED)
tasks = [
    ("Страницы", "Каталог, карточка, вход, добавление игры, новинки."),
    ("Сервер и база", "Сессия, отзывы, средняя, запрет чужих правок."),
    ("Магазины", "Ссылка только туда, где игра есть, и оценка этого магазина."),
    ("Проверка", "Восемь автотестов и ручной проход по основным экранам."),
]
for index, (head, body) in enumerate(tasks):
    top = 2.75 + index * 0.95
    rect(slide, 0.48, top, 2.9, 0.8, RED, rounded=True)
    add_text(slide, 0.58, top + 0.18, 2.7, 0.45, head, 15, WHITE, True, PP_ALIGN.CENTER)
    add_text(slide, 3.6, top + 0.16, 9.1, 0.5, body, 20, INK)
notes(
    slide,
    "Команда проекта: Иванов Никита Сергеевич, разработчик, группа БПИ2304. "
    "В работу вошли страницы, сервер и база, ссылки на магазины и проверка. "
    "По своей части готов ответить на вопросы.",
)

# 11. Индивидуальные достижения
slide = prs.slides.add_slide(BLANK)
chrome(slide, 11)
kicker(slide, "Участник")
title(slide, "Иванов Никита Сергеевич", top=0.5)
add_text(slide, 0.48, 1.45, 12, 0.4, "Разработчик", 20, MUTED)
add_text(slide, 0.48, 2.05, 8, 0.35, "Ключевые результаты", 16, RED, True)
results = [
    "Каталог, вход, отзыв, новинки и тёмная тема.",
    "Один отзыв на человека и запрет чужой правки.",
    "Восемь автотестов и ручной проход экранов.",
]
for index, line in enumerate(results):
    add_text(slide, 0.48, 2.5 + index * 0.55, 8.2, 0.5, "•  " + line, 20, INK)
add_text(slide, 0.48, 4.3, 12.3, 0.7, "Технологии: Next.js, React, TypeScript, Tailwind, SQLite, Node.js.", 18, MUTED)
stats = [("9", "страниц"), ("8", "тестов"), ("8", "историй"), ("10", "игр в каталоге")]
for index, (num, label) in enumerate(stats):
    left = 0.48 + index * 3.2
    rect(slide, left, 5.2, 3.02, 1.5, CARD, LINE, True)
    add_text(slide, left, 5.35, 3.02, 0.6, num, 28, RED, True, PP_ALIGN.CENTER)
    add_text(slide, left, 6.0, 3.02, 0.4, label, 16, INK, align=PP_ALIGN.CENTER)
notes(
    slide,
    "Мои результаты: собраны страницы каталога, входа, отзыва и новинок, есть тёмная тема. "
    "Один человек не может оставить второй отзыв на ту же игру, чужое править нельзя. "
    "Автотестов восемь, пользовательских историй восемь, в стартовом каталоге десять игр. "
    "Технологии те же, что на слайде со стеком.",
)

# 12. Достигнутые результаты проекта
slide = prs.slides.add_slide(BLANK)
chrome(slide, 12)
kicker(slide, "Результаты")
title(slide, "Что получилось")
done = [
    ("10 игр", "Стартовый каталог и 16 отзывов. Средняя считается на сайте."),
    ("Честная оценка", "Один отзыв на пару «человек + игра». Чужое изменить нельзя."),
    ("Внешние данные", "Обложка, ссылка на магазин и оценка этого магазина на кнопке."),
    ("Новинки", "Даты со страницы магазина. Цена в рублях, тенге, долларах и евро."),
]
for index, (head, body) in enumerate(done):
    col = index % 2
    row = index // 2
    left = 0.48 + col * 6.4
    top = 1.9 + row * 2.35
    rect(slide, left, top, 6.15, 2.15, CARD, LINE, True)
    add_text(slide, left + 0.3, top + 0.25, 5.55, 0.5, head, 24, INK, True)
    add_text(slide, left + 0.3, top + 0.95, 5.55, 0.9, body, 18, MUTED)
notes(
    slide,
    "За проект получился рабочий сайт. В комплекте десять игр и шестнадцать отзывов. "
    "Средняя считается только по отзывам на Полке. Второй отзыв того же человека не сохраняется. "
    "У игры есть обложка и кнопка магазина, только если игра там продаётся, рядом оценка этого магазина. "
    "На новинках дата и цена в четырёх валютах. Рубли посчитаны из долларовой цены по курсу Банка России.",
)

# 13. План развития. Не возвращаем старый заключительный слайд «Дальше».
slide = prs.slides.add_slide(BLANK)
chrome(slide, 13)
kicker(slide, "План развития")
title(slide, "Куда можно расти")
rect(slide, 0.48, 1.9, 6.05, 4.6, CARD, LINE, True)
add_text(slide, 0.78, 2.15, 5.5, 0.45, "Ближайшее", 24, INK, True)
add_lines(
    slide,
    0.78,
    2.9,
    5.4,
    3.1,
    ["Отзыв на карточке новинки.", "Больше игр в стартовом наборе.", "Своя оценка не смешивается с оценкой магазина."],
    20,
    INK,
    gap=16,
)
rect(slide, 6.8, 1.9, 6.05, 4.6, RGBColor(0x1C, 0x19, 0x15), rounded=True)
add_text(slide, 7.1, 2.15, 5.5, 0.45, "Позже", 24, WHITE, True)
add_lines(
    slide,
    7.1,
    2.9,
    5.4,
    3.1,
    ["Постоянный адрес, чтобы сайт жил без включённого компьютера.", "Кабинет студии для чтения отзывов своего круга.", "Продажи игр по-прежнему нет."],
    20,
    WHITE,
    gap=16,
)
notes(
    slide,
    "Ближайшие шаги: дать оставить отзыв на новинку и расширить стартовый набор. "
    "Своя средняя и оценка магазина остаются разными цифрами. "
    "Позже сайт можно вынести на постоянный адрес, чтобы он открывался без включённого компьютера, "
    "и сделать кабинет для студии. Продавать игры Полка не будет.",
)

# 14. Заключение
slide = prs.slides.add_slide(BLANK)
chrome(slide, 14)
kicker(slide, "Заключение")
title(slide, "Полка считает свою среднюю")
add_lines(
    slide,
    0.48,
    2.15,
    12.2,
    2.4,
    [
        "Каталог отзывов, где у текста есть имя автора.",
        "Один человек — один отзыв. Чужое изменить нельзя.",
        "Прототип открывается и проходит основные сценарии.",
    ],
    26,
    INK,
    gap=14,
)
rect(slide, 0.48, 4.9, 2.2, 0.06, RED)
add_text(slide, 0.48, 5.2, 10, 0.45, "Иванов Никита Сергеевич", 24, INK, True)
add_text(slide, 0.48, 5.75, 10, 0.4, "Группа БПИ2304  ·  готов ответить на вопросы", 20, MUTED)
notes(
    slide,
    "Коротко: «Полка» — каталог отзывов, средняя считается по людям этого сайта, у каждого отзыва есть имя. "
    "Один человек оставляет один отзыв, чужое править нельзя. Прототип работает, сценарии я только что показал. "
    "Меня зовут Иванов Никита Сергеевич, группа БПИ2304. Готов ответить на вопросы. Спасибо.",
)

out = "presentation/Polka.pptx"
prs.save(out)
print(out, "slides", TOTAL)
