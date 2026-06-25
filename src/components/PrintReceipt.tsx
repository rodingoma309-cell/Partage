import React from "react";
import { ReceiptState } from "../types";

interface PrintReceiptProps {
  state: ReceiptState;
}

export default function PrintReceipt({ state }: PrintReceiptProps) {
  const itemTotal = state.items.reduce((sum, item) => sum + item.price, 0);
  const tipAmount = state.tipType === 'percentage' 
    ? (itemTotal * state.tip / 100) 
    : state.tip;
  const grandTotal = itemTotal + state.tax + tipAmount;

  const rate = state.currencyRate || 2038;
  const isUSD = state.primaryCurrency === 'USD';

  // Helper to format values in the document
  const formatVal = (amount: number) => {
    if (isUSD) {
      const fcVal = Math.round(amount * rate);
      return {
        primary: `${amount.toFixed(2)} $`,
        secondary: `${fcVal.toLocaleString('fr-FR')} FC`
      };
    } else {
      const usdVal = amount / rate;
      return {
        primary: `${Math.round(amount).toLocaleString('fr-FR')} FC`,
        secondary: `${usdVal.toFixed(2)} $`
      };
    }
  };

  const formattedSubtotal = formatVal(itemTotal);
  const formattedTax = formatVal(state.tax);
  const formattedTip = formatVal(tipAmount);
  const formattedTotal = formatVal(grandTotal);

  // Compute breakdown for each person
  const breakdowns = state.people.map(person => {
    const assignedItems = state.items.filter(item => item.assignedTo.includes(person.id));
    const itemsBreakdown = assignedItems.map(item => {
      const sharePrice = item.price / item.assignedTo.length;
      return {
        name: item.name,
        sharePrice
      };
    });

    const personSubtotal = itemsBreakdown.reduce((sum, item) => sum + item.sharePrice, 0);
    const taxShare = itemTotal > 0 ? (personSubtotal * (state.tax / itemTotal)) : 0;
    const tipShare = itemTotal > 0 ? (personSubtotal * (tipAmount / itemTotal)) : 0;
    const totalOwed = personSubtotal + taxShare + tipShare;

    return {
      person,
      items: itemsBreakdown,
      subtotal: personSubtotal,
      taxShare,
      tipShare,
      total: totalOwed,
    };
  });

  return (
    <div id="print-view" className="hidden print:block bg-white text-black p-8 font-mono text-sm max-w-2xl mx-auto">
      {/* Receipt Header */}
      <div className="text-center space-y-1 border-b border-dashed border-black pb-6">
        <h1 className="text-xl font-bold tracking-widest">PARTAG'ADD</h1>
        <p className="text-xs uppercase tracking-wider">Répartition de l'addition par IA</p>
        <div className="text-xs text-slate-500 pt-2">
          <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
          <span className="mx-2">|</span>
          <span>Heure : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-xs font-bold pt-1">
          Taux de change appliqué : 1 USD = {rate.toLocaleString('fr-FR')} FC
        </p>
        <p className="text-xs">
          Devise d'origine : {isUSD ? "Dollar ($)" : "Franc Congolais (FC)"}
        </p>
      </div>

      {/* Table of items */}
      <div className="my-6">
        <h2 className="font-bold border-b border-black pb-1 uppercase text-xs tracking-wider mb-3">Articles du Ticket</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase">
              <th className="py-1">Article</th>
              <th className="py-1 text-right">Prix (Origine)</th>
              <th className="py-1 text-right">Prix (Converti)</th>
              <th className="py-1 text-right">Attribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.items.map((item) => {
              const formattedItem = formatVal(item.price);
              const assignedNames = item.assignedTo.length > 0
                ? state.people
                    .filter(p => item.assignedTo.includes(p.id))
                    .map(p => p.name)
                    .join(', ')
                : "Non attribué";

              return (
                <tr key={item.id} className="text-xs">
                  <td className="py-2 pr-2">{item.name}</td>
                  <td className="py-2 text-right font-bold">{formattedItem.primary}</td>
                  <td className="py-2 text-right text-slate-600">{formattedItem.secondary}</td>
                  <td className="py-2 text-right italic text-slate-500 truncate max-w-[150px]">
                    {assignedNames}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Calculations summary */}
      <div className="border-t border-b border-dashed border-black py-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Sous-total :</span>
          <span className="font-bold">{formattedSubtotal.primary} ({formattedSubtotal.secondary})</span>
        </div>
        <div className="flex justify-between">
          <span>Taxe (TVA) :</span>
          <span className="font-bold">{formattedTax.primary} ({formattedTax.secondary})</span>
        </div>
        <div className="flex justify-between">
          <span>Pourboire ({state.tipType === 'percentage' ? `${state.tip}%` : 'Fixe'}) :</span>
          <span className="font-bold">{formattedTip.primary} ({formattedTip.secondary})</span>
        </div>
        <div className="flex justify-between text-sm font-extrabold border-t border-slate-300 pt-2">
          <span>TOTAL GENERAL :</span>
          <span>{formattedTotal.primary} ({formattedTotal.secondary})</span>
        </div>
      </div>

      {/* Breakdowns per person */}
      <div className="my-6">
        <h2 className="font-bold border-b border-black pb-1 uppercase text-xs tracking-wider mb-4">Répartition par Participant</h2>
        <div className="space-y-4">
          {breakdowns.map(({ person, items, subtotal, taxShare, tipShare, total }) => {
            const formattedTotalOwed = formatVal(total);
            return (
              <div key={person.id} className="border-l-2 border-black pl-3 py-1 space-y-1.5">
                <div className="flex justify-between font-bold text-xs uppercase items-center">
                  <div className="flex items-center space-x-2">
                    {person.avatar && (
                      <img 
                        src={person.avatar} 
                        alt={person.name} 
                        className="w-5 h-5 rounded-full object-cover border border-black shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span>{person.name}</span>
                  </div>
                  <span>{formattedTotalOwed.primary} ({formattedTotalOwed.secondary})</span>
                </div>
                
                {/* Individual list of items */}
                <div className="text-[11px] text-slate-600">
                  {items.length === 0 ? (
                    <p className="italic">Aucun article assigné</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5">
                      {items.map((it, i) => {
                        const formattedShare = formatVal(it.sharePrice);
                        return (
                          <li key={i}>
                            {it.name} : <span className="font-bold">{formattedShare.primary}</span> ({formattedShare.secondary})
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Sub-breakdowns for taxes/tips */}
                {items.length > 0 && (
                  <div className="text-[10px] text-slate-500 pt-1 flex gap-3 font-mono">
                    <span>Part S-Total : {formatVal(subtotal).primary}</span>
                    <span>Part Taxe : {formatVal(taxShare).primary}</span>
                    <span>Part Pourb : {formatVal(tipShare).primary}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative footer */}
      <div className="text-center pt-8 border-t border-dashed border-black mt-12 space-y-2">
        <p className="text-xs italic">Merci de votre confiance !</p>
        <p className="text-[10px] text-slate-400">Généré automatiquement par Partag'Add.</p>
      </div>
    </div>
  );
}
