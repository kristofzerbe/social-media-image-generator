
/**
 * Execution:
 * node index.mjs "/source/_posts" "/photos" "template.handlebars" "/social-media-images"
 */

import Generator from "./social-media-image-generator.mjs"

const postFolder = process.argv[2].toString();
const photoFolder = process.argv[3].toString();
const templateFile = process.argv[4].toString()
const targetFolder = process.argv[5].toString();

const generator = new Generator(postFolder, photoFolder, templateFile, targetFolder);
generator.generate();