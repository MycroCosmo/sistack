import { collectMapper } from './mybatis.mjs';

export const collectIbatis = (file, text, graph) => collectMapper(file, text, graph, 'ibatis2');
