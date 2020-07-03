
const path = require('path');

const Template = require('easy-template-string').default;

module.exports = class PageFilenameGenerator {

    constructor(outputBaseName, details, pageCountProperty = 'pageCount') {
        this._details = details;
        if (!details[pageCountProperty]) {
            throw new Error(`Page count property (${pageCountProperty}) does not exist`);
        }
        this._pageCount = details[pageCountProperty];
        this._outputBaseName = outputBaseName;
        if (Template.isTemplate(outputBaseName)) {
            this._template = new Template(outputBaseName);
        }
    }

    getFilename(page) {
        if (this._template) {
            const properties = { ... this._details, pageNumber: page };
            return this._template.interpolate(properties);
        } else if (this._pageCount === 1 && page === 1) {
            return this._outputBaseName;
        } else {
            const pathParts = path.parse(this._outputBaseName);
            pathParts.name += `_${page}`;
            delete pathParts.base;
            return path.format(pathParts);
        }
    }
}