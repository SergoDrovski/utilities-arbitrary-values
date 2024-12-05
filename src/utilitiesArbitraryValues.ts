// Типы данных
type MediaQuery = {
	key: number;
	value: string;
} | null;

type TemplateCssFunction = (value: string) => string;

type FunctionCollection = {
	[key: string]: TemplateCssFunction;
};

type MatchedUtilities = {
	[key: string]: (classEntity: ClassEntity) => CssEntity;
};

type ClassEntity = {
	prefix: string;
	value: string;
	media: string | null;
};

type CssEntity = {
	mediaQuery: MediaQuery;
	className: string;
	css: string;
};

type CssMap = {
	[key: string]: CssEntity[];
};

//Опрелделение постфикса в названии класса
function getMediaQuerySize(media: string): MediaQuery {
	switch (media) {
		case 'xl': return { key: 1400, value: 'min-width: 1400px' };
		case 'lg': return { key: 1199, value: 'max-width: 1199px' };
		case 'md': return { key: 991, value: 'max-width: 991px' };
		case 'sm': return { key: 767, value: 'max-width: 767px' };
		case 'xs': return { key: 575, value: 'max-width: 575px' };
		default: return null;
	}
}

// Преобразование kebab-case в camelCase (Форматирование ключей)
function kebabToCamelCase(str: string): string {
	const parts = str.split('-');
	return parts[0] + parts.slice(1).map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

// Генерация списка функций утулит, каждая возвращает объект утилиты
function matchUtilities(utilities: FunctionCollection): MatchedUtilities {
	const result: MatchedUtilities = {};
	for (const key in utilities) {
		const templateCssFunction : TemplateCssFunction = utilities[key];
		result[key] = ({ prefix, value, media } : ClassEntity) : CssEntity => {
			const css = templateCssFunction(value);
			const mediaQuery = getMediaQuerySize(media || '');
			const className = `${prefix}-[${value}]${media ? '@' + media : ''}`.replace(/[\[\]#@%]/g, '\\$&'); // eslint-disable-line
			return { className, mediaQuery, css };
		};
	}
	return result;
}

// Извлечение пользовательских классов и преобразование в ClassEntity
function extractArbitraryClasses(): ClassEntity[] {
	const result: ClassEntity[] = [];
	const uniqueKeys = new Set<string>();
	const regex = /([\w-]+)-\[(.+?)\](?:@(\w+))?/;

	// Получаем все элементы с классами
	document.querySelectorAll('[class]').forEach(element => {
		element.classList.forEach(className => {
			const match = className.match(regex);
			if (match) {
				const [, prefix, value, media] = match;
				const key = `${prefix}-${value}-${media || ''}`;
				if (!uniqueKeys.has(key)) {
					uniqueKeys.add(key);
					result.push({ prefix, value, media: media || null });
				}
			}
		});
	});

	return result;
}

// Генерация CSS из карты (объктов CssEntity)
function generateCSS(cssMap: CssMap): string {
	let cssOutput = '';
	// Начинаем с конца тк подход от декстопа к мобе
	const array = Object.entries(cssMap);
	for (let i = array.length - 1; i >= 0; i--) {
		const [key, rules] = array[i];
		let tmpCss = '';
		rules.forEach((rule: CssEntity) => {
			const { className, css } = rule;
			tmpCss += `.${className}${css} `;
		});

		if (key === 'all') {
			cssOutput += tmpCss;
		} else {
			const { mediaQuery } = rules[0];
			if (mediaQuery) {
				cssOutput += `@media(${mediaQuery.value}){${tmpCss}} `;
			}
		}
	}
	return cssOutput.trim();
}

// Создание карты CSS путем сопоставления объекта класса со списком функций утулит
function generateCssMap(arrayClassEntity: ClassEntity[], utilities: MatchedUtilities): CssMap {
	const map: CssMap = {};
	arrayClassEntity.forEach((classEntity: ClassEntity) => {
		const prefix = kebabToCamelCase(classEntity.prefix);
		if (utilities[prefix] && classEntity.value) {
			const cssEntity: CssEntity = utilities[prefix](classEntity);
			const key = cssEntity.mediaQuery ? cssEntity.mediaQuery.key.toString() : 'all';
			if (!map[key]) {
				map[key] = [];
			}
			map[key].push(cssEntity);
		}
	});
	return map;
}

// Инициализация утилит
const utils: MatchedUtilities = matchUtilities({
	w: (value) => `{width: ${value}}`,
	minW: (value) => `{min-width: ${value}}`,
	maxW: (value) => `{max-width: ${value}}`,
	h: (value) => `{height: ${value}}`,
	minH: (value) => `{min-height: ${value}}`,
	maxH: (value) => `{max-height: ${value}}`,
	mx: (value) => `{margin-inline: ${value}}`,
	mt: (value) => `{margin-top: ${value}}`,
	mb: (value) => `{margin-bottom: ${value}}`,
	ml: (value) => `{margin-left: ${value}}`,
	mr: (value) => `{margin-right: ${value}}`,
	py: (value) => `{padding-block: ${value}}`,
	px: (value) => `{padding-inline: ${value}}`,
	pt: (value) => `{padding-top: ${value}}`,
	pb: (value) => `{padding-bottom: ${value}}`,
	pl: (value) => `{padding-left: ${value}}`,
	pr: (value) => `{padding-right: ${value}}`,
	g: (value) => `{--column-gap: ${value}; gap: ${value};}`,
	cg: (value) => `{--column-gap: ${value}; -moz-column-gap: ${value}; column-gap: ${value}}`,
	rg: (value) => `{row-gap: ${value}}`,
	z: (value) => `{z-index: ${value}}`,
	top: (value) => `{top: ${value}}`,
	bottom: (value) => `{bottom: ${value}}`,
	left: (value) => `{left: ${value}}`,
	right: (value) => `{right: ${value}}`,
	font: (value) => `{font: ${value.replace(/_/g, ' ')}}`,
	text: (value) => `{font-size: ${value}}`,
	color: (value) => `{color: ${value}}`,
	bg: (value) => `{background-color: ${value}}`,
	br: (value) => `{border-radius: ${value}}`,
});

// Применение утилит и генерация стилей
const exec = () => {
	const extractedClasses: ClassEntity[] = extractArbitraryClasses();
	if (extractedClasses.length === 0) return;

	const map: CssMap = generateCssMap(extractedClasses, utils);
	if (Object.values(map).length === 0) return;

	const styleText: string = generateCSS(map);
	const elemStyle: HTMLStyleElement = document.createElement('style');
	elemStyle.innerHTML = styleText;
	document.head.append(elemStyle);
};
exec();
