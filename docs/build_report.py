"""Собрать отчёт по проектному практикуму."""

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = "docs/Отчет.docx"
FONT = "Times New Roman"


def font(run, size, bold=False, italic=False, color=None):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    r_pr = run._element.get_or_add_rPr()
    r_fonts = r_pr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.append(r_fonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        r_fonts.set(qn(attr), FONT)


def page_number(paragraph):
    run = paragraph.add_run()
    font(run, 12)
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(end)


doc = Document()
section = doc.sections[0]
section.page_width = Cm(21.0)
section.page_height = Cm(29.7)
section.left_margin = Cm(2.5)
section.right_margin = Cm(1.5)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.different_first_page_header_footer = True
section.header_distance = Cm(1.27)
section.footer_distance = Cm(1.27)
section.footer.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
page_number(section.footer.paragraphs[0])
first_footer = section.first_page_footer.paragraphs[0]
first_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
first_footer.paragraph_format.space_before = Pt(0)
first_footer.paragraph_format.space_after = Pt(0)
moscow = first_footer.add_run("Москва 2026")
font(moscow, 14)

doc.core_properties.author = "Иванов Никита Сергеевич"
doc.core_properties.title = "Отчет. Полка — отзывы на игры"
doc.core_properties.subject = "Проектный практикум"
doc.core_properties.category = "БПИ2304"


def blank(size=14):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run("")
    font(run, size)
    return p


def center(text, size=14, bold=False, before=0, after=0, italic=False, spacing=1.15):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = spacing
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run(text)
    font(run, size, bold, italic)
    return p


def right(text, size=14, bold=False, before=0, after=0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run(text)
    font(run, size, bold)
    return p


def toc_item(title, page):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(17), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    run = p.add_run(title)
    font(run, 14)
    page_run = p.add_run(f"\t{page}")
    font(page_run, 14)
    return p


def body(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Cm(1.25)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run(text)
    font(run, 14)
    return p


def heading(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    font(run, 16, True)
    return p


def bullet(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.25)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run("–  " + text)
    font(run, 14)
    return p


def caption(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(text)
    font(run, 12, italic=True)
    return p


def picture(path, cap):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run()
    run.add_picture(path, width=Cm(15.2))
    caption(cap)


def shade(cell, hex_color):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tc_pr.append(shd)


def table(headers, rows, widths):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    tbl.autofit = False
    for index, text in enumerate(headers):
        cell = tbl.rows[0].cells[index]
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(text)
        font(run, 12, True, color=RGBColor(0xFF, 0xFF, 0xFF))
        shade(cell, "1C1915")
        cell.width = Cm(widths[index])
    for r, row in enumerate(rows):
        for c, text in enumerate(row):
            cell = tbl.rows[r + 1].cells[c]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(text)
            font(run, 12, bold=(c == 0))
            if r % 2 == 1:
                shade(cell, "F4EFE6")
            cell.width = Cm(widths[c])
    for index, row in enumerate(tbl.rows):
        tr_pr = row._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        tr_pr.append(cant)
        if index == 0:
            repeat = OxmlElement("w:tblHeader")
            tr_pr.append(repeat)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


# Титул как в образце лабораторной: шапка по центру, ФИО и группа справа,
# «Москва 2026» в нижнем колонтитуле первой страницы.
center(
    "МИНИСТЕРСТВО ЦИФРОВОГО РАЗВИТИЯ, СВЯЗИ И МАССОВЫХ КОММУНИКАЦИЙ РОССИЙСКОЙ ФЕДЕРАЦИИ",
    13,
    True,
    after=4,
    spacing=1.5,
)
center(
    "Ордена Трудового Красного Знамени федеральное государственное бюджетное образовательное учреждение высшего образования",
    13,
    after=4,
    spacing=1.5,
)
center(
    "«Московский технический университет связи и информатики»",
    14,
    True,
    after=6,
    spacing=1.5,
)
center("", 14, after=18, spacing=1.5)
center("ОТЧЁТ", 22, True, after=8, spacing=1.5)
center("по дисциплине «Проектный практикум»", 14, after=14, spacing=1.5)
center("Тема: агрегатор отзывов на видеоигры «Полка»", 14, after=28, spacing=1.5)
right("Выполнил:", after=4)
right("студент", after=4)
right("Иванов Никита Сергеевич", bold=True, after=4)
right("группа БПИ2304", after=16)

doc.add_page_break()

center("Содержание", 16, True, before=0, after=16)
for title, page in [
    ("1. Введение", 3),
    ("2. Постановка задачи", 3),
    ("3. Аналоги", 4),
    ("4. Требования", 4),
    ("5. Устройство сайта", 5),
    ("6. Что сделано", 6),
    ("7. Откуда берутся обложки", 9),
    ("8. Проверка", 9),
    ("9. Запуск и порядок показа", 10),
    ("Заключение", 11),
    ("Список источников", 11),
]:
    toc_item(title, page)

doc.add_page_break()

body(
    "Цель работы: сделать сайт, на котором люди пишут отзывы на игры, а средняя оценка считается только по этим отзывам."
)
body("Задачи:")
bullet("собрать каталог с поиском, фильтром по жанру и сортировкой;")
bullet("сделать регистрацию и вход, чтобы отзыв был привязан к человеку;")
bullet("запретить второй отзыв одного человека на ту же игру и запретить правку чужого;")
bullet("давать добавлять игру из готового списка или вручную;")
bullet("подставлять обложку со страницы игры в Steam или с сайта студии;")
bullet("проверить основные сценарии тестами и руками.")

heading("1. Введение")
body(
    "В магазине у игры обычно одна общая оценка. За ней тысячи людей, и по самой цифре не понять, кому игра зашла, а кому нет. Короткого отзыва с именем автора рядом часто нет: есть либо толпа баллов, либо длинный разбор."
)
body(
    "«Полка» — небольшой сайт, на котором люди сами добавляют игры, пишут отзывы и ставят оценку от 1 до 10. Среднее на карточке считается только по этим отзывам. Оценка из магазина на сайт не копируется."
)
heading("2. Постановка задачи")
body(
    "Тема взята из перечня проектного практикума: агрегатор отзывов на видеоигры. Пользователь добавляет игры, пишет рецензии и ставит оценки, а средняя считается по сообществу сайта. Отдельная нетривиальная часть — данные об игре из внешнего источника: обложка, страница магазина и оценка этого магазина."
)
body("Работу выполнил студент Иванов Никита Сергеевич, группа БПИ2304. В проект вошло следующее.")
table(
    ["Часть работы", "Что сделано"],
    [
        ["Страницы", "Каталог, карточка игры, вход, регистрация, добавление игры, страница своих записей, новинки."],
        ["Сервер и база", "Сессия, хеш пароля, отзывы, средняя, запрет чужих правок, файл SQLite."],
        ["Магазины", "Ссылка только туда, где игра продаётся, и оценка игроков этого магазина рядом с кнопкой."],
        ["Проверка", "Автотесты и ручной проход: фильтр, ошибка пароля, добавление игры, чужая карточка."],
    ],
    [4.2, 12.3],
)
body(
    "Отдельного заказчика, кроме преподавателя, у проекта нет. Решения о составе функций принимались по тексту задания: обязательны операции создания, чтения, изменения и удаления, вход и хотя бы одна задача сложнее обычной формы. Платежи, карта и викторина в реальном времени в тему не входили и не делались."
)

heading("3. Аналоги")
body(
    "Крупные сайты про игры уже есть. «Полка» их не заменяет и не пытается собрать такую же базу. Сравнение нужно, чтобы было видно, чего на сайте нет и в чём отличие."
)
table(
    ["Сервис", "Что у него есть", "Чего нет для этой задачи"],
    [
        ["Steam", "Магазин, обложки, много оценок", "Не видно, кто из знакомых поставил балл"],
        ["Metacritic", "Оценки критиков и игроков в одной цифре", "Короткий отзыв конкретного человека"],
        ["RAWG", "Большой каталог игр и картинки", "Своё сообщество и своя средняя"],
        ["Полка", "Имя автора, один отзыв, своя средняя", "Магазина и большой базы игр нет"],
    ],
    [3.4, 6.4, 6.4],
)
body(
    "Аудитория на старте узкая: человек, который вечером выбирает игру и хочет прочитать два-три отзыва, а не тысячу оценок. Сначала это свои — одногруппники и знакомые. Потом любой, кто зарегистрировался."
)

heading("4. Требования")
body("Сайт считается готовым, когда выполнены такие сценарии.")
bullet("Гость открывает каталог без регистрации и видит игры, среднюю и число отзывов.")
bullet("Гость ищет по названию, студии или жанру, фильтрует жанр и меняет порядок сортировки. Пустой результат объяснён текстом, а не пустой страницей.")
bullet("Новый человек регистрируется и входит. После входа в шапке видно имя.")
bullet("Вошедший добавляет игру из готового списка или заполняет карточку сам. Повтор того же названия не создаётся.")
bullet("Вошедший ставит оценку от 1 до 10 и пишет отзыв. Средняя и гистограмма пересчитываются. Второй отзыв на ту же игру не принимается.")
bullet("Автор отзыва может исправить или удалить свой текст. Чужой отзыв удалить нельзя.")
bullet("Автор карточки может изменить или удалить свою игру вместе с отзывами. Чужую карточку изменить нельзя.")
bullet("Без ключа внешнего каталога сайт всё равно запускается: поиск идёт по встроенному списку.")
body(
    "Ограничения, которые держат оценку честной: один отзыв на пару «человек + игра», оценка только целым числом от 1 до 10, пароль в базе хранится как хеш, а не открытым текстом. Сессия живёт в cookie и не видна скриптам страницы."
)

heading("5. Устройство сайта")
body(
    "Сайт состоит из трёх частей. Браузер показывает страницы. Сервер принимает действия форм: войти, сохранить отзыв, добавить игру, удалить свою карточку. Данные лежат в одном файле SQLite. Отдельный сервер базы не нужен: файл создаётся при первом запуске и сразу заполняется десятью играми и шестнадцатью отзывами."
)
body("Страницы:")
bullet("главная — каталог, поиск, жанр, сортировка;")
bullet("карточка игры — описание, обложка, средняя, гистограмма, отзывы, форма;")
bullet("добавление и правка игры;")
bullet("вход и регистрация;")
bullet("свои игры и свои отзывы;")
bullet("новинки: игры, которые скоро выйдут или только что вышли, с ценой в рублях, тенге, долларах и евро;")
bullet("переключатель светлой и тёмной темы.")
body(
    "В базе четыре таблицы: пользователи, сессии, игры и отзывы. У отзыва есть ограничение уникальности на пару «игра + пользователь». При удалении игры её отзывы удаляются вместе с ней. Связь «кто добавил игру» нужна, чтобы чужую карточку нельзя было открыть на редактирование."
)
body(
    "Пароль превращается в хеш алгоритмом scrypt с солью. В cookie кладётся только случайный ключ сессии, срок — 14 дней. Формы устроены так, что при ошибке введённые поля, кроме пароля, остаются на месте."
)
body(
    "Внешние данные разделены на две задачи. Текст и поля новой игры при наличии ключа берутся из RAWG. Если ключа нет или сервис не ответил, используется встроенный список из десяти игр, которых нет в стартовом наборе. Обложка от этого списка не зависит: она ищется отдельно."
)

heading("6. Что сделано")
body(
    "Стартовый каталог: Hollow Knight, Celeste, Hades, Stardew Valley, Disco Elysium, Outer Wilds, Portal 2, The Witcher 3, Counter-Strike 2 и Dota 2. Отзывы написаны от трёх человек. У Hollow Knight три оценки — 9, 8 и 10, поэтому средняя равна 9,0. На главной выше стоит игра с более высокой средней."
)
picture("presentation/screens/catalog.png", "Рисунок 1. Каталог: обложка, жанр, год и средняя")
body(
    "На карточке видна обложка, студия, год, кто добавил игру, средняя и распределение оценок. Гостю вместо формы показывается предложение войти. После входа на этом месте форма своего отзыва."
)
picture("presentation/screens/game.png", "Рисунок 2. Карточка Hollow Knight, гость ещё не вошёл")
body(
    "Добавление игры начинается с поиска. Если подходящей карточки нет, поля заполняются вручную. Повтор названия не создаёт вторую игру, а предлагает открыть уже существующую."
)
picture("presentation/screens/add.png", "Рисунок 3. Поиск Cuphead перед добавлением в каталог")
body(
    "Страница со своим именем собирает игры, которые добавил текущий пользователь, и его отзывы. Чужие записи туда не попадают."
)
picture("presentation/screens/me.png", "Рисунок 4. Игры и отзывы демо-аккаунта")

heading("7. Откуда берутся обложки")
body(
    "На карточке не должно быть пустого цветного квадрата с буквами вместо рисунка. Когда игру добавляют, сайт ищет её в магазине Steam. Если название совпадает, скачивается шапка страницы игры и сохраняется в каталог сайта. Показ дальше не зависит от того, открыт ли Steam в этот момент."
)
body(
    "Совпадение проверяется строго: полное равенство названия или то же название с подзаголовком. Короткий обрывок вроде «Cup» обложку Cuphead не получает, чтобы на карточку не попала чужая картинка."
)
body(
    "Если шапку Steam скачать не удалось, сайт открывает официальную страницу студии из карточки Steam и берёт оттуда картинку, которую страница сама объявляет обложкой. Так сделано для игр, которых в Steam нет. Minecraft в стартовом поиске как раз такой случай: рисунок взят с сайта minecraft.net."
)
body(
    "Для игр, которые уже лежат в комплекте, обложки сохранены заранее. Поэтому каталог из десяти игр выглядит одинаково и без интернета. Новая игра, которой нет в комплекте, в момент добавления требует доступ к Steam или к сайту студии."
)
body(
    "Рядом со ссылкой на магазин показывается оценка игроков этого магазина, если её удалось прочитать. У Steam это доля положительных отзывов. У Epic Games и Xbox — средняя оценка из пяти. Своя средняя «Полки» от этих цифр не зависит. Если игры в магазине нет, кнопки этого магазина нет."
)

heading("8. Проверка")
body("Команда npm test проверяет то, что легко сломать незаметно:")
bullet("адрес игры строится из названия, в том числе из русского;")
bullet("в сохранённом пароле нет самого пароля, верный пароль подходит, неверный — нет;")
bullet("средняя считается до одного знака;")
bullet("поиск по встроенному списку не выходит за его пределы;")
bullet("в стартовом наборе десять игр, у Hollow Knight, Counter-Strike 2 и Dota 2 есть обложки;")
bullet("фильтр «Платформер» оставляет Celeste, поиск по Valve находит Counter-Strike 2, Dota 2 и Portal 2;")
bullet("второй отзыв того же человека на ту же игру не сохраняется;")
bullet("удалить игру может только тот, кто её добавил.")
body(
    "Руками проверены главная, карточка, пустой поиск, неверный пароль с сохранением почты, вход, правка своего отзыва, добавление игры с обложкой со Steam, страница своих записей, выход, регистрация, запрет правки чужой карточки и узкий экран телефона. На ширине 390 пикселей страница не разъезжается в сторону."
)

heading("9. Запуск и порядок показа")
body("Нужен Node.js 22. В папке проекта:")
bullet("npm install")
bullet("npm run dev")
body("Сайт открывается по адресу http://127.0.0.1:47231. Ключ RAWG необязателен. Если он есть, его кладут в файл .env.local в переменную RAWG_API_KEY.")
body("Для показа уже создан пользователь: почта demo@polka.local, пароль polka1234. Порядок на демонстрации такой.")
bullet("На главной выбрать жанр «Платформер» и нажать «Показать». Останется Celeste.")
bullet("Открыть Hollow Knight и показать оценку 9,0 и три отзыва.")
bullet("Войти демо-аккаунтом.")
bullet("Через «Добавить игру» найти Cuphead и добавить её. Обложка уже стоит на результате поиска.")
bullet("Поставить этой игре одну оценку и показать, что средняя стала равна ей.")
bullet("Нажать имя в шапке и показать свои игры и свои отзывы.")

heading("Заключение")
body(
    "Сделан сайт «Полка»: каталог отзывов на игры, в котором средняя считается по людям этого сайта. Есть регистрация и вход, один отзыв на игру от человека, правка только своего, поиск, фильтр и сортировка, светлая и тёмная тема. Новую игру можно взять из готового списка или завести вручную. Обложка берётся со Steam или с сайта студии. Кнопка магазина появляется только если игра там есть, а рядом с ней — оценка игроков этого магазина."
)
body(
    "Отдельно собрана страница новинок: даты и описания со Steam, цена в тенге, долларах и евро с той же страницы, рубли — из долларовой цены по курсу Банка России."
)
body(
    "Проект запускается на своём компьютере одной командой после установки зависимостей. Проверки проходят командой npm test."
)
body("Иванов Никита Сергеевич, группа БПИ2304.")

heading("Список источников")
sources = [
    "Документация Next.js. — URL: https://nextjs.org/docs (дата обращения: 12.10.2026).",
    "RAWG Video Games Database API. — URL: https://rawg.io/apidocs (дата обращения: 12.10.2026).",
    "Steamworks. Документация магазина Steam. — URL: https://partner.steamgames.com/doc/store (дата обращения: 12.10.2026).",
    "SQLite Documentation. — URL: https://sqlite.org/docs.html (дата обращения: 12.10.2026).",
    "Методические материалы по дисциплине «Проектный практикум»: требования к проекту, ролям и итоговой защите.",
]
for index, text in enumerate(sources, 1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.left_indent = Cm(0.75)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(f"{index}. {text}")
    font(run, 14)

doc.save(OUT)
print(OUT)
