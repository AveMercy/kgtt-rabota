import type { LectureBlock } from '@/types/lecture';

export interface LectureImportResult {
    blocks: LectureBlock[];
    errors: string[];
}

const blockTypes = new Set<LectureBlock['type']>([
    'heading', 'text', 'section', 'code', 'info', 'warning', 'success',
    'image', 'file', 'carousel', 'table', 'list',
]);

const typeAliases: Record<string, LectureBlock['type']> = {
    заголовок: 'heading',
    текст: 'text',
    секция: 'section',
    код: 'code',
    инфо: 'info',
    важно: 'warning',
    успех: 'success',
    картинка: 'image',
    файл: 'file',
    карусель: 'carousel',
    таблица: 'table',
    список: 'list',
};

let importIdCounter = 0;
const createId = () => `imported-block-${Date.now()}-${++importIdCounter}`;

function fail(line: number, message: string): never {
    throw new Error(`Строка ${line}: ${message}`);
}

function parseAttributes(source: string, line: number): Record<string, string> {
    const attributes: Record<string, string> = {};
    const pattern = /([a-zA-Z][\w-]*)=(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)'|([^\s]+))/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source)) !== null) {
        if (source.slice(cursor, match.index).trim()) {
            fail(line, `не удалось разобрать параметры «${source.slice(cursor, match.index).trim()}».`);
        }
        const key = match[1].toLowerCase();
        if (Object.hasOwn(attributes, key)) fail(line, `параметр «${key}» указан несколько раз.`);
        attributes[key] = (match[2] ?? match[3] ?? match[4]).replace(/\\(["'\\])/g, '$1');
        cursor = pattern.lastIndex;
    }

    if (source.slice(cursor).trim()) {
        fail(line, `не удалось разобрать параметры «${source.slice(cursor).trim()}».`);
    }
    return attributes;
}

function assertAttributes(attributes: Record<string, string>, allowed: string[], line: number) {
    const unknown = Object.keys(attributes).find((key) => !allowed.includes(key));
    if (unknown) fail(line, `неизвестный параметр «${unknown}».`);
}

function requiredAttribute(attributes: Record<string, string>, name: string, line: number): string {
    const value = attributes[name]?.trim();
    if (!value) fail(line, `укажите обязательный параметр ${name}="...".`);
    return value;
}

function makeBlock(type: LectureBlock['type'], fields: Partial<LectureBlock> = {}): LectureBlock {
    return { id: createId(), type, ...fields };
}

function splitTableRow(line: string): string[] {
    const source = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    const cells: string[] = [];
    let cell = '';
    let escaped = false;
    for (const character of source) {
        if (escaped) {
            cell += character;
            escaped = false;
        } else if (character === '\\') {
            escaped = true;
        } else if (character === '|') {
            cells.push(cell.trim());
            cell = '';
        } else {
            cell += character;
        }
    }
    if (escaped) cell += '\\';
    cells.push(cell.trim());
    return cells;
}

function parseTable(lines: string[], startLine: number): LectureBlock {
    if (lines.length < 2) fail(startLine, 'таблице нужны строка заголовков и строка-разделитель.');
    const headers = splitTableRow(lines[0]);
    const separators = splitTableRow(lines[1]);
    if (!headers.length || separators.length !== headers.length ||
        separators.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
        fail(startLine + 1, 'ожидалась строка-разделитель таблицы, например | --- | --- |.');
    }
    const rows = lines.slice(2).map((row, index) => {
        const cells = splitTableRow(row);
        if (cells.length !== headers.length) {
            fail(startLine + index + 2, `в строке таблицы ${cells.length} ячеек вместо ${headers.length}.`);
        }
        return cells;
    });
    return makeBlock('table', { headers, rows });
}

function parseExplicitBlock(
    typeName: string,
    rawAttributes: string,
    body: string[],
    line: number,
    blockIndex: number,
): LectureBlock {
    const normalizedType = typeName.toLowerCase();
    const type = blockTypes.has(normalizedType as LectureBlock['type'])
        ? normalizedType as LectureBlock['type']
        : typeAliases[normalizedType];
    if (!type) fail(line, `неизвестный тип блока «${typeName}».`);

    const attributes = parseAttributes(rawAttributes, line);
    const content = body.join('\n').trim();
    switch (type) {
        case 'heading': {
            assertAttributes(attributes, ['level'], line);
            const level = attributes.level ? Number(attributes.level) : 2;
            if (level !== 1 && level !== 2 && level !== 3) fail(line, 'уровень заголовка должен быть 1, 2 или 3.');
            if (!content) fail(line, 'добавьте текст заголовка.');
            return makeBlock('heading', { level, content });
        }
        case 'text':
            assertAttributes(attributes, [], line);
            if (!content) fail(line, 'добавьте текст блока.');
            return makeBlock('text', { content });
        case 'section': {
            assertAttributes(attributes, ['number', 'title'], line);
            const number = attributes.number ? Number(attributes.number) : blockIndex + 1;
            if (!Number.isInteger(number) || number < 1) fail(line, 'номер секции должен быть целым числом больше нуля.');
            return makeBlock('section', { number, title: requiredAttribute(attributes, 'title', line), content });
        }
        case 'code':
            assertAttributes(attributes, ['language'], line);
            return makeBlock('code', { language: attributes.language || '', code: body.join('\n') });
        case 'info':
        case 'warning':
        case 'success':
            assertAttributes(attributes, ['title'], line);
            return makeBlock(type, { title: attributes.title || '', content });
        case 'image':
            assertAttributes(attributes, ['src', 'alt'], line);
            if (content) fail(line, 'для изображения используйте параметры src и alt, тело блока оставьте пустым.');
            return makeBlock('image', {
                src: requiredAttribute(attributes, 'src', line),
                alt: attributes.alt || '',
            });
        case 'file': {
            assertAttributes(attributes, ['url', 'name'], line);
            if (content) fail(line, 'для файла используйте параметры url и name, тело блока оставьте пустым.');
            const name = requiredAttribute(attributes, 'name', line);
            return makeBlock('file', {
                fileUrl: requiredAttribute(attributes, 'url', line),
                fileName: name,
                title: name,
            });
        }
        case 'carousel': {
            assertAttributes(attributes, [], line);
            const images = body.map((entry, index) => {
                const match = entry.match(/^\s*-\s+(.+?)\s*$/);
                if (!match) fail(line + index + 1, 'изображение карусели задайте строкой «- URL | описание».');
                const separator = match[1].indexOf('|');
                const src = (separator === -1 ? match[1] : match[1].slice(0, separator)).trim();
                const alt = separator === -1 ? '' : match[1].slice(separator + 1).trim();
                if (!src) fail(line + index + 1, 'укажите URL изображения карусели.');
                return { src, alt };
            });
            if (!images.length) fail(line, 'добавьте хотя бы одно изображение строкой «- URL | описание».');
            return makeBlock('carousel', { images });
        }
        case 'table':
            assertAttributes(attributes, [], line);
            return parseTable(body.filter((row) => row.trim()), line + 1);
        case 'list': {
            assertAttributes(attributes, ['listtype'], line);
            const firstItem = body.find((entry) => entry.trim());
            const inferredType = firstItem && /^\s*\d+[.)]\s+/.test(firstItem) ? 'ordered' : 'unordered';
            const listType = attributes.listtype || inferredType;
            if (listType !== 'ordered' && listType !== 'unordered') {
                fail(line, 'listType должен быть ordered или unordered.');
            }
            const items = body.filter((entry) => entry.trim()).map((entry, index) => {
                const itemPattern = listType === 'ordered' ? /^\s*\d+[.)]\s+(.+?)\s*$/ : /^\s*[-*+]\s+(.+?)\s*$/;
                const match = entry.match(itemPattern);
                if (!match) fail(line + index + 1, `элемент списка должен быть ${listType === 'ordered' ? 'нумерованным' : 'маркированным'}.`);
                return match[1];
            });
            if (!items.length) fail(line, 'добавьте элементы списка.');
            return makeBlock('list', { listType, items });
        }
    }
}

interface ExplicitBlock {
    line: number;
    typeName: string;
    attributes: string;
    body: string[];
}

function parseExplicitDocument(
    lines: string[],
    starts: { line: number; match: RegExpMatchArray }[],
): LectureBlock[] {
    const firstLine = starts[0].line;
    if (lines.slice(0, firstLine).some((line) => line.trim())) {
        fail(1, 'перед первым «Блок N: ...» обнаружен текст; оформите его отдельным блоком.');
    }
    const entries: ExplicitBlock[] = starts.map(({ line, match }, index) => ({
        line: line + 1,
        typeName: match[1],
        attributes: match[2],
        body: lines.slice(line + 1, starts[index + 1]?.line ?? lines.length),
    }));
    return entries.map((entry, index) =>
        parseExplicitBlock(entry.typeName, entry.attributes, entry.body, entry.line, index));
}

function parseMarkdown(lines: string[]): LectureBlock[] {
    const blocks: LectureBlock[] = [];
    let index = 0;
    while (index < lines.length) {
        const current = lines[index];
        if (!current.trim()) {
            index++;
            continue;
        }

        const heading = current.match(/^\s*(#{1,3})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            blocks.push(makeBlock('heading', { level: heading[1].length as 1 | 2 | 3, content: heading[2] }));
            index++;
            continue;
        }

        const fence = current.match(/^\s*```([^\s`]*)\s*$/);
        if (fence) {
            const codeLines: string[] = [];
            const startLine = index + 1;
            index++;
            while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) codeLines.push(lines[index++]);
            if (index === lines.length) fail(startLine, 'не закрыт блок кода; добавьте строку с тремя обратными кавычками.');
            blocks.push(makeBlock('code', { language: fence[1], code: codeLines.join('\n') }));
            index++;
            continue;
        }

        if (current.includes('|') && index + 1 < lines.length &&
            splitTableRow(lines[index + 1]).every((cell) => /^:?-{3,}:?$/.test(cell))) {
            const tableLines = [current, lines[index + 1]];
            const startLine = index + 1;
            index += 2;
            while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
                tableLines.push(lines[index++]);
            }
            blocks.push(parseTable(tableLines, startLine));
            continue;
        }

        const unordered = /^\s*[-*+]\s+(.+?)\s*$/.exec(current);
        const ordered = /^\s*\d+[.)]\s+(.+?)\s*$/.exec(current);
        if (unordered || ordered) {
            const listType = ordered ? 'ordered' : 'unordered';
            const itemPattern = listType === 'ordered' ? /^\s*\d+[.)]\s+(.+?)\s*$/ : /^\s*[-*+]\s+(.+?)\s*$/;
            const items: string[] = [];
            while (index < lines.length) {
                const item = lines[index].match(itemPattern);
                if (!item) break;
                items.push(item[1]);
                index++;
            }
            blocks.push(makeBlock('list', { listType, items }));
            continue;
        }

        const paragraph: string[] = [];
        while (index < lines.length && lines[index].trim() &&
            !/^\s*(?:#{1,3}\s+|```)/.test(lines[index]) &&
            !(lines[index].includes('|') && index + 1 < lines.length &&
                splitTableRow(lines[index + 1]).every((cell) => /^:?-{3,}:?$/.test(cell))) &&
            !/^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(lines[index])) {
            paragraph.push(lines[index++]);
        }
        blocks.push(makeBlock('text', { content: paragraph.join('\n').trim() }));
    }
    return blocks;
}

export function parseLectureText(source: string): LectureImportResult {
    try {
        const lines = source.replace(/\r\n?/g, '\n').split('\n');
        const starts: { line: number; match: RegExpMatchArray }[] = [];
        lines.forEach((line, index) => {
            if (/^\s*Блок(?:\s|$)/i.test(line)) {
                const match = line.match(/^\s*Блок\s+\d+\s*:\s*([^\s]+)(.*)$/i);
                if (!match) fail(index + 1, 'ожидается формат «Блок 1: тип [параметр="значение"]».');
                starts.push({ line: index, match });
            }
        });
        const blocks = starts.length ? parseExplicitDocument(lines, starts) : parseMarkdown(lines);
        if (!blocks.length) return { blocks: [], errors: ['Добавьте текст или хотя бы один блок для импорта.'] };
        return { blocks, errors: [] };
    } catch (error) {
        return {
            blocks: [],
            errors: [error instanceof Error ? error.message : 'Не удалось разобрать текст лекции.'],
        };
    }
}
