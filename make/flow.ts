import os from 'os'
import pLimit from 'p-limit'
import prettier from 'prettier'
import path from 'path'
import { ESLint } from 'eslint'
import { Project } from 'ts-morph' // npm i ts-morph

// 1. Create a single ts-morph project once (cheap to reuse)
const project = new Project({
  useInMemoryFileSystem: true,
  // avoid type-checking to keep it blazing fast
  compilerOptions: { allowJs: false, skipLibCheck: true },
})

// Your prettier options (no plugin loading on each call)
const PRETTIER: prettier.Options = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  printWidth: 72,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  semi: false,
  singleAttributePerLine: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  parser: 'typescript',
}

export async function washFileList(
  fileList: Array<{ file: string; text: string }>,
) {
  // 2. Concurrency ~ number of cores
  const limit = pLimit(Math.max(2, Math.min(8, os.cpus().length)))

  // 3. Add all fileList to the in-memory project once
  for (const f of fileList) {
    project.createSourceFile(f.file, f.text, { overwrite: true })
  }

  // 4. Organize imports for each source file (very fast)
  for (const sourceFile of project.getSourceFiles()) {
    sourceFile.organizeImports()
  }

  // 5. Create ESLint instance
  // const eslint = new ESLint({ fix: true })

  // 6. Read back, ESLint + Prettier format in parallel (in-memory)
  const taskList = fileList.map(({ file }) =>
    limit(async () => {
      const sf = project.getSourceFileOrThrow(file)
      const organized = sf.getFullText()

      // // Apply ESLint fixes for spacing
      // const eslintResults = await eslint.lintText(organized, { filePath: file })
      // const eslintFixed = eslintResults[0]?.output || organized

      // Load prettier config from project
      const prettierConfig =
        (await prettier.resolveConfig(process.cwd())) || PRETTIER
      const formatted = await prettier.format(organized, {
        ...prettierConfig,
        parser: 'typescript',
      })
      return {
        file,
        text: formatted,
      }
    }),
  )

  return Promise.all(taskList)
}
