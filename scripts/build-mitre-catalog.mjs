import fs from 'node:fs';
import path from 'node:path';
import { TACTIC_METADATA_PT, translateTechniqueName, translateTechnicalProse } from './translator-pt.mjs';
import { ICE_BREAKER_SCENARIOS, LOLBAS_ARSENAL, MITIGATION_BYPASS_MAP, buildTechniqueBypassGuide } from './ice-breaker-data.mjs';

console.log('[CYBER-ATTACK 2077] A processar base de dados STIX 2.1 oficial do MITRE ATT&CK...');

const rawData = JSON.parse(fs.readFileSync('raw-enterprise-attack.json', 'utf8'));
const objects = rawData.objects.filter(o => !o.revoked && !o.x_mitre_deprecated);

const byId = new Map();
for (const obj of objects) {
  byId.set(obj.id, obj);
}

function getMitreId(obj) {
  const ref = obj?.external_references?.find(r => r.source_name === 'mitre-attack');
  return ref?.external_id || '';
}

function getMitreUrl(obj) {
  const ref = obj?.external_references?.find(r => r.source_name === 'mitre-attack');
  return ref?.url || '';
}

// 1. Extrair Matriz e Táticas na ordem oficial da Kill Chain
const matrixObj = objects.find(o => o.type === 'x-mitre-matrix');
const tactics = [];
const tacticByShortname = new Map();

for (let i = 0; i < matrixObj.tactic_refs.length; i++) {
  const tObj = byId.get(matrixObj.tactic_refs[i]);
  if (!tObj) continue;
  const id = getMitreId(tObj);
  const shortname = tObj.x_mitre_shortname;
  const metaPt = TACTIC_METADATA_PT[shortname] || {
    namePt: tObj.name,
    nameEn: tObj.name,
    subtitle: tObj.name,
    descriptionPt: translateTechnicalProse(tObj.description),
    pentesterRole: 'Execução tática dentro da cadeia de ataque MITRE ATT&CK.',
    color: '#00f0ff'
  };

  const tacticEntry = {
    id,
    stixId: tObj.id,
    order: i + 1,
    shortname,
    nameEn: tObj.name,
    namePt: metaPt.namePt,
    subtitle: metaPt.subtitle,
    descriptionPt: translateTechnicalProse(tObj.description || ''),
    pentesterRole: metaPt.pentesterRole,
    color: metaPt.color,
    url: getMitreUrl(tObj)
  };
  tactics.push(tacticEntry);
  tacticByShortname.set(shortname, tacticEntry);
}

// 2. Mapear Analytics (x-mitre-analytic)
const analyticsByStixId = new Map();
for (const obj of objects) {
  if (obj.type === 'x-mitre-analytic') {
    analyticsByStixId.set(obj.id, {
      id: getMitreId(obj),
      name: translateTechnicalProse(obj.name),
      descriptionPt: translateTechnicalProse(obj.description || ''),
      platforms: obj.x_mitre_platforms || [],
      logSources: (obj.x_mitre_log_source_references || []).map(ls => ({
        name: ls.name,
        channel: ls.channel
      })),
      mutableElements: (obj.x_mitre_mutable_elements || []).map(me => ({
        field: me.field,
        description: translateTechnicalProse(me.description)
      }))
    });
  }
}

// 3. Mapear Detection Strategies (x-mitre-detection-strategy)
const detectionByStixId = new Map();
for (const obj of objects) {
  if (obj.type === 'x-mitre-detection-strategy') {
    const analytics = (obj.x_mitre_analytic_refs || [])
      .map(ref => analyticsByStixId.get(ref))
      .filter(Boolean);
    detectionByStixId.set(obj.id, {
      id: getMitreId(obj),
      name: translateTechnicalProse(obj.name),
      url: getMitreUrl(obj),
      analytics: analytics.slice(0, 4)
    });
  }
}

// 4. Mapear Mitigações (course-of-action)
const mitigationByStixId = new Map();
for (const obj of objects) {
  if (obj.type === 'course-of-action') {
    const mId = getMitreId(obj);
    const bypassInfo = MITIGATION_BYPASS_MAP[mId] || null;
    mitigationByStixId.set(obj.id, {
      id: mId,
      name: translateTechnicalProse(obj.name),
      descriptionPt: translateTechnicalProse(obj.description || ''),
      url: getMitreUrl(obj),
      bypassHint: bypassInfo ? bypassInfo.bypassStrategyPt : null
    });
  }
}

// 5. Mapear Ferramentas (tool) e Malware (malware) e Grupos APT (intrusion-set)
const softwareByStixId = new Map();
for (const obj of objects) {
  if (obj.type === 'tool' || obj.type === 'malware') {
    softwareByStixId.set(obj.id, {
      id: getMitreId(obj),
      name: obj.name,
      type: obj.type === 'tool' ? 'Tool' : 'Malware',
      platforms: obj.x_mitre_platforms || [],
      url: getMitreUrl(obj)
    });
  }
}

const groupByStixId = new Map();
for (const obj of objects) {
  if (obj.type === 'intrusion-set') {
    groupByStixId.set(obj.id, {
      id: getMitreId(obj),
      name: obj.name,
      aliases: (obj.aliases || []).slice(0, 4),
      url: getMitreUrl(obj)
    });
  }
}

// 6. Mapear Relações (relationships)
const mitigationsForAp = new Map(); // apStixId -> [{ id, name, relationshipDescPt, bypassHint }]
const detectionsForAp = new Map();  // apStixId -> [detectionStrategy]
const toolsForAp = new Map();       // apStixId -> [{ id, name, type, examplePt }]
const groupsForAp = new Map();      // apStixId -> [{ id, name, examplePt }]
const parentOfSub = new Map();      // subStixId -> parentStixId

for (const rel of objects) {
  if (rel.type !== 'relationship') continue;
  const src = rel.source_ref;
  const tgt = rel.target_ref;
  const rType = rel.relationship_type;

  if (rType === 'subtechnique-of') {
    parentOfSub.set(src, tgt);
  } else if (rType === 'mitigates') {
    const mit = mitigationByStixId.get(src);
    if (mit) {
      if (!mitigationsForAp.has(tgt)) mitigationsForAp.set(tgt, []);
      mitigationsForAp.get(tgt).push({
        id: mit.id,
        name: mit.name,
        descriptionPt: rel.description ? translateTechnicalProse(rel.description) : mit.descriptionPt,
        bypassHint: mit.bypassHint
      });
    }
  } else if (rType === 'detects') {
    const det = detectionByStixId.get(src);
    if (det) {
      if (!detectionsForAp.has(tgt)) detectionsForAp.set(tgt, []);
      detectionsForAp.get(tgt).push(det);
    }
  } else if (rType === 'uses') {
    const sw = softwareByStixId.get(src);
    if (sw && tgt.startsWith('attack-pattern--')) {
      if (!toolsForAp.has(tgt)) toolsForAp.set(tgt, []);
      const list = toolsForAp.get(tgt);
      // Priorizar Tools (ex: Mimikatz, Impacket, BloodHound, Rubeus) e top Malware
      if (list.length < 10 || sw.type === 'Tool') {
        list.push({
          id: sw.id,
          name: sw.name,
          type: sw.type,
          procedurePt: rel.description ? translateTechnicalProse(rel.description) : ''
        });
      }
    }
    const grp = groupByStixId.get(src);
    if (grp && tgt.startsWith('attack-pattern--')) {
      if (!groupsForAp.has(tgt)) groupsForAp.set(tgt, []);
      const list = groupsForAp.get(tgt);
      if (list.length < 6) {
        list.push({
          id: grp.id,
          name: grp.name,
          procedurePt: rel.description ? translateTechnicalProse(rel.description) : ''
        });
      }
    }
  }
}

// 7. Processar todas as 706 Técnicas e Sub-técnicas (attack-pattern)
const rawTechniques = objects.filter(o => o.type === 'attack-pattern');

// Primeiro indexar sub-técnicas por parent ID
const subsByParentId = new Map();
const apByMitreId = new Map();

for (const ap of rawTechniques) {
  const mId = getMitreId(ap);
  apByMitreId.set(mId, ap);
  if (ap.x_mitre_is_subtechnique && mId.includes('.')) {
    const parentId = mId.split('.')[0];
    if (!subsByParentId.has(parentId)) subsByParentId.set(parentId, []);
    subsByParentId.get(parentId).push({
      id: mId,
      name: translateTechniqueName(ap.name),
      stixId: ap.id
    });
  }
}

// Ordenar sub-técnicas por ID
for (const [, list] of subsByParentId) {
  list.sort((a, b) => a.id.localeCompare(b.id));
}

// Processar cada técnica num formato rico e otimizado
const allTechniques = [];

for (const ap of rawTechniques) {
  const id = getMitreId(ap);
  const isSub = Boolean(ap.x_mitre_is_subtechnique);
  const parentId = isSub && id.includes('.') ? id.split('.')[0] : null;
  const parentAp = parentId ? apByMitreId.get(parentId) : null;

  const fullNameEn = parentAp ? `${parentAp.name}: ${ap.name}` : ap.name;
  const namePt = translateTechniqueName(ap.name);
  const fullNamePt = parentAp
    ? `${translateTechniqueName(parentAp.name)}: ${namePt}`
    : namePt;

  const tacticShortnames = (ap.kill_chain_phases || [])
    .filter(k => k.kill_chain_name === 'mitre-attack')
    .map(k => k.phase_name);

  const platforms = ap.x_mitre_platforms || [];
  const descriptionPt = translateTechnicalProse(ap.description || '');

  const mitigations = (mitigationsForAp.get(ap.id) || []).slice(0, 8);
  const detections = (detectionsForAp.get(ap.id) || []).slice(0, 4);

  // Ordenar tools para colocar 'Tool' antes de 'Malware'
  const rawTools = toolsForAp.get(ap.id) || [];
  rawTools.sort((a, b) => (a.type === 'Tool' ? -1 : 1) - (b.type === 'Tool' ? -1 : 1));
  const tools = rawTools.slice(0, 8);

  const groups = (groupsForAp.get(ap.id) || []).slice(0, 5);

  // Referências académicas e técnicas externas
  const references = (ap.external_references || [])
    .filter(r => r.source_name !== 'mitre-attack' && r.url)
    .slice(0, 6)
    .map(r => ({
      source: r.source_name,
      description: r.description ? translateTechnicalProse(r.description) : r.source_name,
      url: r.url
    }));

  // Sub-técnicas ou irmãs para recomendação de Pivot
  const siblings = isSub
    ? (subsByParentId.get(parentId) || []).filter(s => s.id !== id)
    : (subsByParentId.get(id) || []);

  const bypassGuide = buildTechniqueBypassGuide(
    { id, name: ap.name, platforms, tactics: tacticShortnames },
    mitigations,
    detections,
    siblings
  );

  // Extrair comandos/exemplos de código inline da descrição para quick-reference tático
  const codeMatches = [];
  const codeRegex = /`([^`\n]{4,140})`/g;
  let match;
  while ((match = codeRegex.exec(descriptionPt)) !== null) {
    const snippet = match[1].trim();
    if (!snippet.startsWith('Ref:') && !/^T\d{4}/.test(snippet) && !/^M\d{4}/.test(snippet) && !/^TA\d{4}/.test(snippet)) {
      if (!codeMatches.includes(snippet)) codeMatches.push(snippet);
    }
  }

  allTechniques.push({
    id,
    isSubtechnique: isSub,
    parentId,
    nameEn: ap.name,
    fullNameEn,
    namePt,
    fullNamePt,
    tactics: tacticShortnames,
    platforms,
    version: ap.x_mitre_version || '1.0',
    modified: (ap.modified || '').slice(0, 10),
    url: getMitreUrl(ap),
    descriptionPt,
    codeArtifacts: codeMatches.slice(0, 8),
    subtechniqueIds: isSub ? [] : (subsByParentId.get(id) || []).map(s => s.id),
    mitigations,
    detections,
    tools,
    groups,
    references,
    bypassGuide
  });
}

allTechniques.sort((a, b) => a.id.localeCompare(b.id));

const outDir = path.resolve(process.env.COLLECT_TRANSLATIONS === '1' ? '.translation-work' : 'public/data');
fs.mkdirSync(outDir, { recursive: true });

const catalogPayload = {
  metadata: {
    title: 'CYBER-ATTACK 2077 // MITRE ATT&CK Enterprise Tactical Catalog',
    specVersion: 'STIX 2.1 / ATT&CK v18+',
    generatedAt: new Date().toISOString().slice(0, 10),
    counts: {
      tactics: tactics.length,
      totalTechniques: allTechniques.length,
      parentTechniques: allTechniques.filter(t => !t.isSubtechnique).length,
      subtechniques: allTechniques.filter(t => t.isSubtechnique).length,
      mitigations: mitigationByStixId.size,
      detections: detectionByStixId.size,
      toolsAndMalware: softwareByStixId.size,
      aptGroups: groupByStixId.size,
      iceBreakerScenarios: ICE_BREAKER_SCENARIOS.length
    }
  },
  tactics,
  iceBreakerScenarios: ICE_BREAKER_SCENARIOS,
  lolbasArsenal: LOLBAS_ARSENAL,
  mitigationBypassMap: MITIGATION_BYPASS_MAP,
  techniques: allTechniques
};

const outPath = path.join(outDir, 'mitre-catalog.json');
fs.writeFileSync(outPath, JSON.stringify(catalogPayload));

const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
console.log(`[CYBER-ATTACK 2077] Catálogo compilado com sucesso em ${outPath} (${sizeMB} MB)`);
console.log('Estatísticas:', catalogPayload.metadata.counts);
