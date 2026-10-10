import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Block = { kind: 'paragraph'; lines: string[] } | { kind: 'list'; items: string[] };

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
const STRONG = /\*\*(.+?)\*\*/g;

const groupLines = (lines: string[]): Block[] =>
  lines.reduce<Block[]>((blocks, line) => {
    const isItem = BULLET.test(line);
    const last = blocks.at(-1);
    if (isItem && last?.kind === 'list') {
      last.items.push(line.replace(BULLET, ''));
    } else if (!isItem && last?.kind === 'paragraph') {
      last.lines.push(line);
    } else {
      blocks.push(isItem ? { kind: 'list', items: [line.replace(BULLET, '')] } : { kind: 'paragraph', lines: [line] });
    }
    return blocks;
  }, []);

const toBlocks = (text: string): Block[] =>
  text
    .split(/\n{2,}/)
    .map((chunk) => chunk.split('\n').filter((line) => line.trim() !== ''))
    .flatMap(groupLines);

const renderInline = (line: string): ReactNode[] =>
  line.split(STRONG).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );

interface SafeMarkdownProps {
  text: string;
  className?: string;
}

export function SafeMarkdown({ text, className }: SafeMarkdownProps) {
  return (
    <div className={cn('flex max-w-[70ch] flex-col gap-3 text-sm leading-relaxed text-ink', className)}>
      {toBlocks(text).map((block, index) =>
        block.kind === 'list' ? (
          <ul key={index} className="flex flex-col gap-1 pl-4">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="list-disc marker:text-ink-3">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        )
      )}
    </div>
  );
}
