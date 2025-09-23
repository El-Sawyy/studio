"use client";

import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextInputProps {
    label: string;
    value: string;
    onChange: (html: string) => void;
}

export default function RichTextInput({ label, value, onChange }: RichTextInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleCommand = (command: string) => {
        document.execCommand(command, false, undefined);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleLink = () => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);

        let url = prompt('Enter the URL:', 'https://');
        if (url) {
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('createLink', false, url);
            if (editorRef.current) {
                editorRef.current.focus();
                onChange(editorRef.current.innerHTML);
            }
        }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        let html = e.clipboardData.getData('text/html');

        if (!html) {
            let text = e.clipboardData.getData('text/plain');
            html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/(\r\n|\n|\r)/gm, '<br>');
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        tempDiv.querySelectorAll('*').forEach(el => {
            el.removeAttribute('class');
            el.removeAttribute('style');
        });
        
        const sanitizedHtml = tempDiv.innerHTML;
        document.execCommand('insertHTML', false, sanitizedHtml);
        
        if (e.currentTarget) {
           onChange(e.currentTarget.innerHTML);
        }
    };

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
            <div className="w-full border rounded-md bg-card">
                <div className="flex items-center gap-1 p-1 border-b">
                    <Button type="button" title="Bold" variant="ghost" size="icon" onMouseDown={e => e.preventDefault()} onClick={() => handleCommand('bold')} className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
                    <Button type="button" title="Italic" variant="ghost" size="icon" onMouseDown={e => e.preventDefault()} onClick={() => handleCommand('italic')} className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
                    <Button type="button" title="Underline" variant="ghost" size="icon" onMouseDown={e => e.preventDefault()} onClick={() => handleCommand('underline')} className="h-8 w-8"><Underline className="h-4 w-4" /></Button>
                    <Button type="button" title="Bulleted List" variant="ghost" size="icon" onMouseDown={e => e.preventDefault()} onClick={() => handleCommand('insertUnorderedList')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
                    <Button type="button" title="Link" variant="ghost" size="icon" onMouseDown={e => e.preventDefault()} onClick={handleLink} className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button>
                </div>
                <div
                    ref={editorRef}
                    contentEditable={true}
                    onInput={handleInput}
                    onPaste={handlePaste}
                    className="p-2 min-h-[100px] text-card-foreground focus:outline-none rich-text-editor prose dark:prose-invert max-w-none"
                    style={{ lineHeight: '1.5' }}
                ></div>
            </div>
        </div>
    );
}
