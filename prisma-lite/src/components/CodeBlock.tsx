import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const languageMap: Record<string, string> = {
    js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', go: 'go', java: 'java',
    css: 'css', html: 'xml', bash: 'bash', sh: 'bash',
    yaml: 'yaml', yml: 'yaml', json: 'json', sql: 'sql',
    dockerfile: 'dockerfile', docker: 'dockerfile',
};

interface Props {
    language?: string;
    code: string;
}

export default function CodeBlock({ language, code }: Props) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const normalizedLang = language?.toLowerCase() || '';
    const hljsLang = languageMap[normalizedLang] || normalizedLang || 'text';

    return (
        <div className="my-6 rounded-xl overflow-hidden border bg-[#0d1117]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-xs text-slate-400 font-mono">{language || 'code'}</span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs text-slate-400 hover:text-white">
                    {copied ? <><Check className="h-3 w-3 mr-1" />Скопировано</> : <><Copy className="h-3 w-3 mr-1" />Копировать</>}
                </Button>
            </div>
            <SyntaxHighlighter
                language={hljsLang}
                style={atomOneDark}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}