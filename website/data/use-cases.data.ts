import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export default {
  watch: ["../use-cases/*.md"],

  load(files) {
    return files
      .map((file) => {
        const slug = path.basename(file, '.md')

        const contents = fs.readFileSync(file, 'utf-8')
        const frontmatter = contents.split('---\n')[1]

        const data = parse(frontmatter)
        data.link = `/use-cases/${slug}`

        return data
      })
      .filter((x) => x.homepage)
      .sort((a, b) => {
        return parseInt(a.homepage_order) - parseInt(b.homepage_order)
      })
  },
}
