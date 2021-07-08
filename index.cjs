
/**
 * Execution:
 * node index.cjs "/source/_posts" "/photos" "template.handlebars" "/social-media-images"
 */

const Generator = require("./social-media-image-generator.cjs").Generator;

const postFolder = process.argv[2].toString();
const photoFolder = process.argv[3].toString();
const templateFile = process.argv[4].toString();
const targetFolder = process.argv[5].toString();

const generator = new Generator(postFolder, photoFolder, templateFile, targetFolder);
generator.generate();