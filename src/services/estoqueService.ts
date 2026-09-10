import { MaterialConsumo } from '../types/erp';

export interface MaterialCurvaABC extends MaterialConsumo {
  valorTotalItem: number;
  pctDoTotal: number;
  pctAcumulado: number;
  classe: 'A' | 'B' | 'C';
}

/**
 * Calcula o valor total financeiro em estoque para uma lista de materiais
 */
export function calcularValorTotalEstoque(materiais: MaterialConsumo[]): number {
  return materiais.reduce((total, mat) => {
    const qtd = Number(mat.quantidade_atual) || 0;
    const valorUnit = Number(mat.valor_unitario) || 0;
    return total + (qtd * valorUnit);
  }, 0);
}

/**
 * Verifica se o material está em estoque crítico (abaixo ou igual ao estoque mínimo)
 */
export function verificarEstoqueCritico(material: MaterialConsumo): boolean {
  const qtdAtual = Number(material.quantidade_atual) || 0;
  const qtdMin = Number(material.quantidade_minima) || 0;
  return qtdAtual <= qtdMin;
}

/**
 * Calcula a Curva ABC (Princípio de Pareto 80/20) para os materiais de consumo:
 * - Classe A: Itens que representam até 80% do valor financeiro acumulado
 * - Classe B: Itens que representam de 80% a 95% do valor financeiro acumulado
 * - Classe C: Itens que representam de 95% a 100% do valor financeiro acumulado
 */
export function calcularCurvaABC(materiais: MaterialConsumo[]): MaterialCurvaABC[] {
  if (!materiais || materiais.length === 0) return [];

  // 1. Calcula o valor financeiro total de cada item
  const itensComValor = materiais.map(mat => {
    const qtd = Number(mat.quantidade_atual) || 0;
    const valorUnit = Number(mat.valor_unitario) || 0;
    const valorTotalItem = qtd * valorUnit;
    return {
      ...mat,
      valorTotalItem
    };
  });

  // 2. Ordena decrescente por valor total
  itensComValor.sort((a, b) => b.valorTotalItem - a.valorTotalItem);

  // 3. Calcula o valor global de todos os itens
  const valorGlobal = itensComValor.reduce((acc, curr) => acc + curr.valorTotalItem, 0);

  // 4. Calcula percentual individual e percentual acumulado com classificação A, B, C
  let acumulado = 0;
  return itensComValor.map(item => {
    const pctDoTotal = valorGlobal > 0 ? (item.valorTotalItem / valorGlobal) * 100 : 0;
    acumulado += pctDoTotal;
    const pctAcumulado = Math.min(100, Math.round(acumulado * 100) / 100);

    let classe: 'A' | 'B' | 'C' = 'C';
    if (pctAcumulado <= 80) {
      classe = 'A';
    } else if (pctAcumulado <= 95) {
      classe = 'B';
    } else {
      classe = 'C';
    }

    return {
      ...item,
      pctDoTotal: Math.round(pctDoTotal * 100) / 100,
      pctAcumulado,
      classe
    };
  });
}
