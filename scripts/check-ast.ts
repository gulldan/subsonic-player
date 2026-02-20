import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type DuplicateEntry = {
  file: string;
  line: number;
  column: number;
  chars: number;
};

const ROOT = process.cwd();
const MIN_BODY_CHARS = Number.parseInt(process.env.AST_MIN_BODY_CHARS ?? '80', 10);

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);
const EXCLUDED_DIRS = new Set(['.git', '.expo', 'node_modules', 'dist', 'server_dist', 'coverage']);

function collectSourceFiles(dir: string, acc: string[]): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, acc);
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
      acc.push(fullPath);
    }
  }
}

function isFunctionLike(
  node: ts.Node,
): node is ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
}

function normalizedBody(
  node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration,
  sourceFile: ts.SourceFile,
): string | null {
  const body = node.body;
  if (!body) return null;
  const normalized = body.getText(sourceFile).replace(/\s+/g, ' ').trim();
  return normalized.length >= MIN_BODY_CHARS ? normalized : null;
}

function buildDuplicateMap(files: string[]): Map<string, DuplicateEntry[]> {
  const duplicates = new Map<string, DuplicateEntry[]>();

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true, scriptKind);

    const visit = (node: ts.Node) => {
      if (isFunctionLike(node)) {
        const body = normalizedBody(node, sourceFile);
        if (body) {
          const paramCount = node.parameters.length;
          const key = `${ts.SyntaxKind[node.kind]}|${paramCount}|${body}`;

          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          const entry: DuplicateEntry = {
            file: path.relative(ROOT, file),
            line: line + 1,
            column: character + 1,
            chars: body.length,
          };

          if (!duplicates.has(key)) {
            duplicates.set(key, []);
          }
          duplicates.get(key)?.push(entry);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return duplicates;
}

function main(): void {
  if (!Number.isFinite(MIN_BODY_CHARS) || MIN_BODY_CHARS <= 0) {
    console.error(`Invalid AST_MIN_BODY_CHARS value: ${process.env.AST_MIN_BODY_CHARS}`);
    process.exit(2);
  }

  const files: string[] = [];
  collectSourceFiles(ROOT, files);

  const duplicateGroups = [...buildDuplicateMap(files).values()]
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length || b[0].chars - a[0].chars);

  if (duplicateGroups.length === 0) {
    console.log(
      `AST duplicate check passed: scanned ${files.length} files, no duplicates found (threshold=${MIN_BODY_CHARS}).`,
    );
    return;
  }

  console.error(
    `AST duplicate check failed: found ${duplicateGroups.length} duplicate group(s) (threshold=${MIN_BODY_CHARS}).`,
  );
  duplicateGroups.forEach((group, index) => {
    console.error(`\n#${index + 1} count=${group.length} chars=${group[0].chars}`);
    group.forEach((entry) => {
      console.error(`- ${entry.file}:${entry.line}:${entry.column}`);
    });
  });

  process.exit(1);
}

main();
