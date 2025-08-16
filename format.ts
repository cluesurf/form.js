import os from 'os'
import pLimit from 'p-limit'
import prettier from 'prettier'
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

export async function formatManyGeneratedTS(
  files: Array<{ path: string; text: string }>,
) {
  // 2. Concurrency ~ number of cores
  const limit = pLimit(Math.max(2, Math.min(8, os.cpus().length)))

  // 3. Add all files to the in-memory project once
  for (const f of files) {
    project.createSourceFile(f.path, f.text, { overwrite: true })
  }

  // 4. Organize imports for each source file (very fast)
  for (const sourceFile of project.getSourceFiles()) {
    sourceFile.organizeImports()
  }

  // 5. Read back, Prettier format in parallel (in-memory)
  const tasks = files.map(({ path }) =>
    limit(async () => {
      const sf = project.getSourceFileOrThrow(path)
      const organized = sf.getFullText()
      return {
        path,
        text: prettier.format(organized, PRETTIER),
      }
    }),
  )

  return Promise.all(tasks)
}