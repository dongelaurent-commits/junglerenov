/* JungleRenov — générateurs PDF partagés (PTZ + TVA) utilisables depuis n'importe
   quelle page. Charger APRÈS jspdf.umd.min.js. Expose window.RFDocs :
     RFDocs.generatePtzDossier(profile, maxAmount)
     RFDocs.generateTvaAttestation(profile)
   Chaque fonction télécharge directement le PDF côté client. */
(function(){
  function getJsPDF(){
    if (!window.jspdf || !window.jspdf.jsPDF) return null;
    return window.jspdf.jsPDF;
  }

  /* Nettoyage caractères pour Helvetica (latin-1 only) — €, ², œ, em-dash, NBSP… */
  function clean(s){
    return String(s == null ? '' : s)
      .replace(/—/g, '-').replace(/–/g, '-')
      .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/€/g, 'EUR').replace(/²/g, '2')
      .replace(/ /g, ' ');
  }

  /* ════════════════════════════════════════════════════════════
     1. DOSSIER ÉCO-PTZ — à apporter à la banque
     ════════════════════════════════════════════════════════════ */
  function generatePtzDossier(profile, maxAmount){
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF indisponible');
    const p = profile || {};
    const fullName = ((p.firstname||'')+' '+(p.lastname||'')).trim() || '—';
    const fmt = n => new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' €';
    const trav = (p.aids && p.aids.travaux) || {};
    const dateFr = new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});
    const works = Array.isArray(p.travaux) ? p.travaux.join(', ') : '—';
    const fmtClean = n => clean(fmt(n));

    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ML = 18, MR = 18, MT = 18;
    let y = MT;
    const lineHeight = 5.5;

    function checkPage(needed){ if (y + needed > pageH - 18) { doc.addPage(); y = MT; } }
    function setFont(style, size, color){
      doc.setFont('helvetica', style || 'normal');
      doc.setFontSize(size || 11);
      const c = color || [30,41,59];
      doc.setTextColor(c[0], c[1], c[2]);
    }
    function text(t, x){ doc.text(clean(t), x == null ? ML : x, y); }
    function row(label, value, bold){
      checkPage(lineHeight + 2);
      setFont('normal', 10, [100,116,139]); text(label, ML);
      setFont(bold ? 'bold' : 'normal', 10, [15,23,42]);
      const wrapped = doc.splitTextToSize(clean(value || '-'), pageW - ML - MR - 70);
      doc.text(wrapped, ML + 70, y);
      const used = Array.isArray(wrapped) ? wrapped.length : 1;
      doc.setDrawColor(241,245,249); doc.setLineWidth(0.2);
      doc.line(ML, y + 1.5 + (used-1)*lineHeight, pageW - MR, y + 1.5 + (used-1)*lineHeight);
      y += lineHeight * used + 1.5;
    }
    function h2(title){
      checkPage(14); y += 4;
      setFont('bold', 12, [15,23,42]); text(title, ML);
      y += 2;
      doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
      doc.line(ML, y, pageW - MR, y); y += 5;
    }
    function paragraph(t, size, color){
      setFont('normal', size || 10, color || [51,65,85]);
      const wrapped = doc.splitTextToSize(clean(t), pageW - ML - MR);
      wrapped.forEach(line => { checkPage(lineHeight); doc.text(line, ML, y); y += lineHeight; });
    }
    function box(title, body){
      const wrapped = doc.splitTextToSize(clean(body), pageW - ML - MR - 8);
      const h = 8 + wrapped.length * lineHeight + (title ? 6 : 0);
      checkPage(h);
      doc.setFillColor(240,253,250); doc.setDrawColor(204,251,241); doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, pageW - ML - MR, h, 2, 2, 'FD');
      let cy = y + 6;
      if (title){ setFont('bold', 10, [19,78,74]); doc.text(clean(title), ML + 4, cy); cy += 5; }
      setFont('normal', 9.5, [19,78,74]);
      wrapped.forEach(line => { doc.text(line, ML + 4, cy); cy += lineHeight; });
      y += h + 4;
    }
    function checklistItem(t){
      checkPage(lineHeight + 1);
      doc.setDrawColor(148,163,184); doc.setLineWidth(0.3);
      doc.rect(ML, y - 3.2, 3.2, 3.2);
      setFont('normal', 10, [51,65,85]);
      const wrapped = doc.splitTextToSize(clean(t), pageW - ML - MR - 8);
      doc.text(wrapped, ML + 6, y);
      y += lineHeight * wrapped.length + 0.5;
    }

    /* ═══ EN-TÊTE ═══ */
    setFont('bold', 9, [13,148,136]); text('JungleRenov  ·  DOSSIER DE DEMANDE'); y += 8;
    setFont('bold', 19, [15,118,110]); text('Éco-prêt à taux zéro'); y += 8;
    paragraph("Document à apporter en agence bancaire. Il permet à votre conseiller de constituer votre dossier de demande d'éco-PTZ.");
    y += 2;

    box('Montant maximal éligible : ' + fmtClean(maxAmount || 0),
        "Plafonds rénovation ponctuelle (service-public.fr F19905) : 7 000 EUR pour 1 action parois vitrées seule · 15 000 EUR pour 1 action autre nature · 25 000 EUR pour un lot de 2 travaux · 30 000 EUR pour 3 travaux ou plus. Durée max 15 ans, 0 % d'intérêts. Le prêt finance uniquement le RAC (coût TTC moins aides directes obtenues). Un plafond de 50 000 EUR sur 20 ans est possible en rénovation globale (audit énergétique démontrant un gain >= 2 classes DPE).");

    // Encadré spécifique MAR si l'utilisateur est en rénovation d'ampleur
    if (p.aids && p.aids.mpr && p.aids.mpr.isRenovAmpleur){
      box("Important : Mon Accompagnateur Rénov' (MAR) obligatoire",
        "Votre projet relève du Parcours accompagné MaPrimeRénov' (audit + 2+ gestes d'isolation + saut de 2 classes DPE). Un MAR agréé par l'ANAH est obligatoire. C'est lui qui déposera votre dossier MPR (pas vous, pas JungleRenov). Vous le choisissez librement dans l'annuaire officiel : france-renov.gouv.fr/annuaires-professionnels/accompagnant. Ses honoraires (1 500 à 3 000 EUR) sont partiellement couverts par le forfait d'accompagnement MPR : " + fmtClean(p.aids.mpr.forfaitMar) + " selon votre catégorie de revenus.");
    }

    h2('1. Emprunteur');
    row('Nom complet', fullName, true);
    row('Email', p.email || '—');
    row('Adresse du logement', p.address || '—');

    h2('2. Logement à rénover');
    row('Type', (p.logement && p.logement.type) || '—');
    row('Surface', ((p.logement && p.logement.surface) ? p.logement.surface + ' m2' : '—'));
    row('Année de construction', (p.logement && p.logement.year) || '—');
    row('DPE actuel', (p.logement && p.logement.dpe) || 'À fournir');

    h2('3. Travaux envisagés');
    row('Postes', works);
    row('Coût HT estimé', fmtClean(trav.totalHT));
    row('Coût TTC estimé', fmtClean(trav.totalTTC), true);
    if ((p.aids && p.aids.totalAides) != null){
      row('Aides directes attendues', fmtClean(p.aids.totalAides));
      const rac = Math.max(0, (trav.totalTTC || 0) - (p.aids.totalAides || 0));
      row('Reste à charge (RAC)', fmtClean(rac), true);
    }

    h2("4. Conditions d'éligibilité (source : service-public.fr F19905)");
    [
      "Logement utilisé en résidence principale (occupé au moins 8 mois par an).",
      "Logement construit depuis plus de 2 ans à la date de début des travaux.",
      "Statut : propriétaire occupant ou bailleur (location dans les 6 mois suivant la fin des travaux).",
      "Aucune condition de ressources — l'éco-PTZ est accordé sans plafond de revenus.",
      "Travaux réalisés par une entreprise certifiée RGE (sauf assainissement non collectif).",
      "Travaux à réaliser dans un délai de 3 ans à compter de l'attribution du prêt.",
      "Durée de remboursement : jusqu'à 15 ans (rénovation ponctuelle) ou 20 ans (rénovation globale).",
      "Cumulable avec MaPrimeRénov', les CEE, les aides de l'Anah, les aides locales et le PTZ accession.",
      "Éco-PTZ complémentaire possible dans un délai de 5 ans (jusqu'au 31/12/2027), plafond cumulé 50 000 EUR."
    ].forEach(checklistItem);

    h2('5. Pièces à apporter en banque');
    [
      "Justificatif d'identité (CNI ou passeport)",
      "Justificatif de domicile de moins de 3 mois",
      "Dernier avis d'imposition",
      "Devis détaillé d'un ou plusieurs artisans RGE",
      "Formulaire 'Emprunteur' (Cerfa R72545 en ligne / R42862 papier)",
      "Formulaire 'Entreprise' rempli par votre artisan RGE selon le type d'éco-PTZ",
      "Si copropriété : extrait du règlement de copropriété + PV d'AG",
      "Si rénovation globale : audit énergétique démontrant un gain >= 2 classes DPE"
    ].forEach(checklistItem);

    h2('6. Banques agréées (à choisir)');
    paragraph("Seules les banques signataires d'une convention avec l'État distribuent l'éco-PTZ. Liste officielle complète sur fgas.fr. Enseignes courantes :");
    y += 1;
    paragraph("Crédit Agricole · BNP Paribas · Société Générale · LCL · Banque Populaire · Caisse d'Épargne · Crédit Mutuel · CIC · La Banque Postale · Boursorama");

    y += 2;
    box('Étapes suivantes',
        "1. Imprimez ce document et rassemblez les pièces ci-dessus.\n" +
        "2. Prenez RDV avec votre conseiller bancaire (la banque vérifie votre capacité de remboursement).\n" +
        "3. La banque instruit votre dossier en 3 à 6 semaines.\n" +
        "4. Le prêt vous est versé directement, en une fois sur devis ou par tranches selon avancement.\n" +
        "5. Les justificatifs de réalisation des travaux doivent être transmis sous 3 ans.");

    // Mention légale obligatoire sur le crédit (Code de la consommation L313-34 / L312-19)
    setFont('normal', 8, [100,116,139]);
    y += 2;
    const legalCredit = "Mention légale : un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager. Vous bénéficiez d'un délai légal de réflexion de 10 jours à compter de la réception de l'offre de prêt (Code de la consommation, articles L313-34 et suivants pour le crédit immobilier).";
    const wrapped = doc.splitTextToSize(clean(legalCredit), pageW - ML - MR);
    wrapped.forEach(line => { checkPage(4.5); doc.text(line, ML, y); y += 4.5; });

    /* Pied de page */
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++){
      doc.setPage(i);
      setFont('normal', 8, [148,163,184]);
      const footer = 'Document généré par JungleRenov le ' + dateFr + ' · Édité par Norakt · Indicatif, à finaliser avec votre conseiller bancaire';
      doc.text(clean(footer), pageW / 2, pageH - 10, { align:'center' });
      doc.text('Page ' + i + ' / ' + pageCount, pageW - MR, pageH - 10, { align:'right' });
    }

    doc.save('dossier-eco-ptz.pdf');
  }

  /* ════════════════════════════════════════════════════════════
     2. ATTESTATION TVA 5,5 % — à remettre à l'artisan
     ════════════════════════════════════════════════════════════ */
  function generateTvaAttestation(profile){
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF indisponible');
    const p = profile || {};
    const fullName = ((p.firstname||'')+' '+(p.lastname||'')).trim() || '—';
    const dateFr = new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});
    const works = Array.isArray(p.travaux) ? p.travaux.join(', ') : '—';

    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ML = 20, MR = 20;
    let y = 22;

    function setFont(style, size, color){
      doc.setFont('helvetica', style || 'normal');
      doc.setFontSize(size || 11);
      const c = color || [30,41,59];
      doc.setTextColor(c[0], c[1], c[2]);
    }
    function paragraph(t, size, color, lh){
      const lineH = lh || 6;
      setFont('normal', size || 11, color || [30,41,59]);
      const wrapped = doc.splitTextToSize(clean(t), pageW - ML - MR);
      wrapped.forEach(line => { doc.text(line, ML, y); y += lineH; });
    }
    function fieldLine(label, value){
      setFont('bold', 11, [15,23,42]);
      const labelW = doc.getTextWidth(clean(label) + ' ');
      doc.text(clean(label), ML, y);
      doc.setDrawColor(148,163,184); doc.setLineWidth(0.3);
      doc.line(ML + labelW, y + 1, pageW - MR, y + 1);
      setFont('normal', 11, [15,23,42]);
      const valWrap = doc.splitTextToSize(clean(value || ''), pageW - ML - MR - labelW - 2);
      doc.text(valWrap[0] || '', ML + labelW + 2, y);
      y += 9;
    }
    function bulletItem(t){
      setFont('normal', 11, [30,41,59]);
      const wrapped = doc.splitTextToSize(clean(t), pageW - ML - MR - 8);
      doc.text('•', ML + 2, y);
      wrapped.forEach((line, i) => { doc.text(line, ML + 7, y); if (i < wrapped.length - 1) y += 6; });
      y += 7;
    }

    setFont('bold', 9, [15,118,110]);
    doc.text('ARTICLE 279-0 BIS DU CGI', pageW / 2, y, { align:'center' });
    y += 9;
    setFont('bold', 16, [15,23,42]);
    const title = doc.splitTextToSize('Attestation TVA 5,5 % sur travaux de rénovation énergétique', pageW - ML - MR);
    title.forEach(line => { doc.text(line, pageW / 2, y, { align:'center' }); y += 7; });
    y += 1;
    setFont('italic', 10, [100,116,139]);
    doc.text("À remettre à l'artisan AVANT le début des travaux", pageW / 2, y, { align:'center' });
    y += 12;

    fieldLine('Je soussigné(e) :', fullName);
    fieldLine('Demeurant à :', p.address || '—');

    setFont('bold', 11, [15,23,42]);
    paragraph("Atteste sur l'honneur que les travaux qui seront réalisés à cette adresse :", 11, [15,23,42], 7);
    y += 1;
    bulletItem("concernent un local d'habitation achevé depuis plus de 2 ans ;");
    bulletItem("portent sur des travaux d'amélioration énergétique (article 200 quater du CGI) ;");
    bulletItem("Travaux envisagés : " + works + ".");

    y += 3;
    setFont('bold', 11, [15,23,42]);
    paragraph("Et déclare que ces travaux relèvent du taux de TVA réduit à 5,5 % en application de l'article 279-0 bis du Code général des impôts.", 11, [15,23,42], 6);

    y += 4;
    const legalText = "Cette attestation engage la responsabilité du déclarant. Toute fausse déclaration expose à des sanctions fiscales (article 1729 du CGI). Document conservé par l'artisan pendant 5 ans à compter de l'opération.";
    const legalWrap = doc.splitTextToSize(clean(legalText), pageW - ML - MR - 8);
    const legalH = legalWrap.length * 5 + 8;
    doc.setFillColor(248,250,252); doc.setDrawColor(226,232,240); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, pageW - ML - MR, legalH, 2, 2, 'FD');
    setFont('normal', 9.5, [100,116,139]);
    let ly = y + 5;
    legalWrap.forEach(line => { doc.text(line, ML + 4, ly); ly += 5; });
    y += legalH + 16;

    const colW = (pageW - ML - MR - 10) / 2;
    const cyStart = y;
    doc.setDrawColor(148,163,184); doc.setLineWidth(0.3);
    doc.line(ML, cyStart + 18, ML + colW, cyStart + 18);
    setFont('normal', 9.5, [100,116,139]);
    doc.text('Signature du client', ML, cyStart + 23);
    doc.text(clean('Fait à _____________ le ' + dateFr), ML, cyStart + 28);
    doc.line(ML + colW + 10, cyStart + 18, pageW - MR, cyStart + 18);
    doc.text("Signature et cachet de l'artisan", ML + colW + 10, cyStart + 23);
    doc.text('SIRET : _____________', ML + colW + 10, cyStart + 28);
    y = cyStart + 36;

    setFont('normal', 8, [148,163,184]);
    doc.text(clean('Modèle simplifié généré par JungleRenov · Conforme art. 279-0 bis du CGI · Le ' + dateFr),
             pageW / 2, pageH - 12, { align:'center' });

    doc.save('attestation-tva-5_5pourcent.pdf');
  }

  /* ════════════════════════════════════════════════════════════
     PDF 3 — Récap d'estimation (lead magnet étape 7)
     ════════════════════════════════════════════════════════════ */
  function generateRecapPdf(result, email){
    const jsPDF = getJsPDF();
    if (!jsPDF) { alert('Générateur PDF indisponible.'); return; }

    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const M = 20, W = 210 - M * 2;
    let y = M;
    const money = n => Math.round(Number(n) || 0).toLocaleString('fr-FR') + ' EUR';

    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('JungleRenov', M, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text("Recap de votre estimation d'aides a la renovation", M, 27);
    y = 44;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text('Vos aides estimees', M, y);
    y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Estimation indicative basee sur les baremes officiels ANAH 2026, ATEE, Service Public et aides locales.', M, y, { maxWidth: W });
    y += 12;

    const p = (result && result.profile) || {};
    const CAT = { bleus:'Tres modestes (bleus)', jaunes:'Modestes (jaunes)', violets:'Intermediaires (violets)', roses:'Superieurs (roses)' };
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, W, p.dpeCurrent ? 34 : 27, 3, 3);
    doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('PROFIL RETENU', M + 4, y + 6);
    doc.setFontSize(10); doc.setTextColor(51, 65, 85);
    doc.text(`Foyer : ${CAT[p.cat] || p.cat || '-'} | RFR ${(p.rfr || 0).toLocaleString('fr-FR')} EUR | ${p.foyer || '-'} personne(s)`, M + 4, y + 13);
    doc.text(`Logement : ${p.surface || '-'} m2 | ${p.heat || '-'} | ${p.region || '-'}${p.dept ? ' | dep. ' + p.dept : ''}`, M + 4, y + 20);
    if (p.dpeCurrent) doc.text(`DPE declare : ${p.dpeCurrent}`, M + 4, y + 27);
    y += (p.dpeCurrent ? 42 : 35);

    doc.setFillColor(15, 118, 110);
    doc.roundedRect(M, y, W, 30, 3, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9);
    doc.text('TOTAL DES AIDES ESTIMEES', M + 6, y + 8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
    doc.text(money(result && result.totalAides), M + 6, y + 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const ttc = (result && result.travaux && result.travaux.totalTTC) || 0;
    const pct = ttc > 0 ? Math.round(((result.totalAides || 0) / ttc) * 100) : 0;
    doc.text(`pour ${money(ttc)} TTC de travaux | soit ${pct} % de prise en charge`, M + 6, y + 27);
    y += 40;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Detail de vos aides', M, y);
    y += 7;

    const rows = [];
    const A = (result && result.aides) || {};
    if (A.mpr && A.mpr.total > 0)   rows.push(["MaPrimeRénov' (ANAH)", A.mpr.total]);
    if (A.cee && A.cee.total > 0)   rows.push([`CEE Coup de pouce (${A.cee.tier === 'precaire' ? 'precaires' : 'standard'}, ATEE)`, A.cee.total]);
    if (A.local && A.local.total > 0) rows.push([A.local.nom || 'Aide locale', A.local.total]);
    if (A.grandEst && Array.isArray(A.grandEst.detail)) {
      A.grandEst.detail.forEach(a => { if (a && a.montant > 0) rows.push([a.nom, a.montant]); });
    }
    if (A.tva && A.tva.total > 0)   rows.push(['Economie TVA 5,5 % vs 10 % (moindre depense, pas une aide)', A.tva.total]);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    rows.forEach(r => {
      doc.setTextColor(51, 65, 85);
      doc.text(String(r[0]), M, y, { maxWidth: W - 42 });
      doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
      doc.text(money(r[1]), 210 - M, y, { align:'right' });
      doc.setFont('helvetica', 'normal');
      y += 7;
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y - 3, 210 - M, y - 3);
    });
    y += 6;

    if (result && result.energie) {
      const surf = p.surface || 1;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
      doc.text('Performance energetique projetee', M, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(51, 65, 85);
      doc.text(`Consommation avant travaux : ${Math.round((result.energie.avant || 0) / surf)} kWh/m2/an`, M, y); y += 6;
      doc.text(`Consommation projetee : ${Math.round((result.energie.apres || 0) / surf)} kWh/m2/an`, M, y); y += 6;
      doc.text(`Economie estimee : ${money(result.energie.economieAn)} /an sur votre facture`, M, y); y += 12;
    }

    doc.setFillColor(254, 243, 199); doc.setDrawColor(252, 211, 77);
    doc.roundedRect(M, y, W, 22, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(120, 53, 15);
    doc.text('Pour aller au bout : votre dossier complet, gratuitement', M + 4, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(146, 64, 14);
    doc.text("Generation des PDF officiels, wizard de depot guide, suivi jusqu'au versement de vos aides.", M + 4, y + 14, { maxWidth: W - 8 });
    doc.text('Rendez-vous sur junglerenov.fr', M + 4, y + 19);
    y += 30;

    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('Sources : Guide ANAH "Les aides financieres en 2026" (edition fevrier 2026), ATEE (Coup de pouce Economies d\'energie 2026),', M, y); y += 4;
    doc.text("Service Public (TVA 5,5 %, éco-PTZ), Climaxion Grand Est. Pour validation personnalisee : France Rénov', 0 808 800 700 (gratuit).", M, y);

    const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text(`Recap genere le ${today} pour ${email} | JungleRenov | Document non contractuel`, 105, 287, { align:'center' });

    doc.save(`JungleRenov_Recap_${p.dept || ''}_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  window.RFDocs = { generatePtzDossier, generateTvaAttestation, generateRecapPdf };
})();
