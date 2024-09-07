import fs from 'fs';
import path from 'path';

export interface Node {
    name: string;
    type: 'dir' | 'file'
    children: Node[];
    path: string;
}

function readDir(_path: string): Node[] {
    if (!fs.existsSync(_path)) {
        return [];
    }
    const files = fs.readdirSync(_path);
    return files.map(e => {
        const p = path.resolve(_path, e);
        const type = fs.statSync(p).isFile()?'file':'dir';
        return {
            name: e,
            type: type,
            children: type === 'dir' ? readDir(p) : [],
            path: p
        };
    });
}

export function readDirTree(path: string, name: string): Node {
    return {
        name,
        type: 'dir',
        children: readDir(path),
        path: path
    };
}
