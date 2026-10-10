"""Приложение к презентации: детализация работ одного участника."""

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

OUT = "docs/Приложение.docx"
FONT = "Times New Roman"


def font(run, size, bold=False):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    r_pr = run._element.get_or_add_rPr()
    r_fonts = r_pr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.append(r_fonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        r_fonts.set(qn(attr), FONT)


doc = Document()
section = doc.sections[0]
section.page_width = Cm(21.0)
section.page_height = Cm(29.7)
section.left_margin = Cm(2.5)
section.right_margin = Cm(1.5)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.footer.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.core_properties.author = "Иванов Никита Сергеевич"
doc.core_properties.title = "Приложение. Детализация работ по проекту «Полка»"
doc.core_properties.subject = "Проектный практикум"


def heading(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run(text)
    font(run, 16, True)


def body(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Cm(1.25)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run(text)
    font(run, 14)


def bullet(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.25)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run("–  " + text)
    font(run, 14)


p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(6)
run = p.add_run("ПРИЛОЖЕНИЕ К ПРЕЗЕНТАЦИИ")
font(run, 16, True)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(12)
run = p.add_run("Детализация работ по проекту «Полка»")
font(run, 14)

body(
    "Участник: Иванов Никита Сергеевич, группа БПИ2304, роль — разработчик. "
    "Дисциплина «Проектный практикум». Продукт — каталог отзывов на игры «Полка»."
)

heading("1. Что сделано")
for line in [
    "Страницы: каталог, карточка игры, вход, регистрация, добавление и правка игры, свои записи, новинки, тёмная тема.",
    "Сервер и база: сессия, хеш пароля, отзывы, средняя, один отзыв на пару «человек + игра», запрет чужой правки, файл SQLite.",
    "Магазины: кнопка только там, где игра продаётся; рядом оценка игроков этого магазина. Обложка со страницы магазина или с сайта студии.",
    "Новинки: даты и описания со страницы магазина, цена в тенге, долларах и евро, рубли — из долларовой цены по курсу Банка России.",
]:
    bullet(line)

heading("2. Пользовательские истории")
body("Все восемь историй из docs/user-stories.md сделаны.")
for line in [
    "Гость открывает каталог без регистрации и видит среднюю и число отзывов.",
    "Гость ищет по названию, фильтрует жанр и меняет сортировку. Пустой результат объяснён текстом.",
    "Новый человек регистрируется и входит. В шапке видно имя. Чужой отзыв удалить нельзя.",
    "Игру можно добавить из списка или вручную. Повтор того же названия не создаёт вторую карточку. У карточки есть обложка.",
    "Оценка от 1 до 10 и текст отзыва пересчитывают среднюю и гистограмму.",
    "Автор отзыва исправляет или удаляет свой текст. Второй отзыв на ту же игру не принимается.",
    "Автор карточки меняет или удаляет свою игру. Чужую карточку открыть на правку нельзя.",
    "Без ключа RAWG сайт запускается: поиск идёт по встроенному списку.",
]:
    bullet(line)

heading("3. Проверка")
body("Команда npm test запускает восемь автотестов. Они проверяют следующее.")
for line in [
    "Адрес игры строится из названия, в том числе из русского.",
    "В сохранённом пароле нет самого пароля. Верный пароль подходит, неверный — нет.",
    "Средняя считается до одного знака.",
    "Поиск по встроенному списку не выходит за его пределы.",
    "В стартовом наборе десять игр. У Hollow Knight, Counter-Strike 2 и Dota 2 есть обложки.",
    "Фильтр «Платформер» оставляет Celeste. Поиск по Valve находит Counter-Strike 2, Dota 2 и Portal 2.",
    "Второй отзыв того же человека на ту же игру не сохраняется.",
    "Удалить игру может только тот, кто её добавил.",
    "Доля положительных отзывов магазина округляется из числа голосов. Рублёвая цена следует курсу.",
]:
    bullet(line)
body(
    "Руками проверены главная, карточка, пустой поиск, неверный пароль, вход, правка своего отзыва, "
    "добавление игры с обложкой, страница своих записей, выход, регистрация, запрет правки чужой карточки "
    "и узкий экран. На ширине 390 пикселей страница не разъезжается в сторону."
)

heading("4. История сборки")
body(
    "В репозитории десять сохранений. Участник один, поэтому отдельной диаграммы по нескольким людям нет. "
    "Ниже — что вошло в сборку, по порядку."
)
for line in [
    "Каркас каталога: игры, отзывы, вход и средняя.",
    "Поля формы не пропадают, если сервер вернул ошибку.",
    "Презентация и архив проекта.",
    "Обложки игр и письменный отчёт.",
    "Тёмная тема и ссылки на магазины.",
    "Кнопка магазина появляется только если игра там продаётся.",
    "В каталог добавлены Counter-Strike 2 и Dota 2. Появились новинки и переключатель валют.",
    "На кнопке магазина видна оценка игроков этого магазина. Обновлены отчёт и презентация.",
    "Титульный лист и содержание отчёта приведены к образцу.",
]:
    bullet(line)
body(
    "Отдельного code review нескольких участников нет: в команде один разработчик. "
    "Свои сценарии закрыты автотестами и ручным проходом, перечень выше."
)

heading("5. Цифры для слайда достижений")
for line in [
    "Страниц с интерфейсом: 9.",
    "Автотестов: 8.",
    "Пользовательских историй: 8, все закрыты.",
    "Игр в стартовом каталоге: 10. Отзывов в комплекте: 16.",
    "Сохранений в репозитории: 10.",
]:
    bullet(line)

doc.save(OUT)
print(OUT)
