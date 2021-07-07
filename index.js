
/**
 * Execution:
 * node index.js "/source/_posts" "/photos" "template.html" "/social-media-images"
 */

import Generator from "./social-media-image-generator.js"

const postFolder = process.argv[2].toString();
const photoFolder = process.argv[3].toString();
const templateFile = process.argv[4].toString()
const targetFolder = process.argv[5].toString();

const generator = new Generator(postFolder, photoFolder, templateFile, targetFolder);
generator.generate();