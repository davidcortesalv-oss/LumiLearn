export type CompoundType =
  | 'oxidos_metalicos'
  | 'oxidos_no_metalicos'
  | 'peroxidos'
  | 'hidruros_metalicos'
  | 'hidruros_no_metalicos'
  | 'hidroxidos'
  | 'sales_binarias'
  | 'hidrácidos'
  | 'oxoacidos'
  | 'oxosales'
  | 'sales_acidas'
  | 'iones';

export type Nomenclature = 'stock' | 'sistematica' | 'tradicional';
export type PracticeDirection = 'formula_to_name' | 'name_to_formula';
export type Difficulty = 'facil' | 'media' | 'dificil';

export interface CompoundEntry {
  id: string;
  type: CompoundType;
  difficulty: Difficulty;
  formula: string;
  names: Record<Nomenclature, string[]>;
  explanation: string;
}

export const COMPOUND_TYPE_LABELS: Record<CompoundType, string> = {
  oxidos_metalicos: 'Òxids metàl·lics',
  oxidos_no_metalicos: 'Òxids no metàl·lics',
  hidruros_metalicos: 'Hidrurs metàl·lics',
  hidruros_no_metalicos: 'Hidrurs no metàl·lics',
  hidroxidos: 'Hidròxids',
  sales_binarias: 'Sales binarias',
  'hidrácidos': 'Hidràcids',
  oxoacidos: 'Oxoàcids',
  oxosales: 'Oxosals',
  iones: 'Ions',
};

export const NOMENCLATURE_LABELS: Record<Nomenclature, string> = {
  stock: 'Stock',
  sistematica: 'Sistemàtica',
  tradicional: 'Tradicional',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fàcil',
  media: 'Mitjana',
  dificil: 'Difícil',
};

const entry = (
  id: string,
  type: CompoundType,
  difficulty: Difficulty,
  formula: string,
  stock: string | string[],
  sistematica: string | string[],
  tradicional: string | string[],
  explanation: string,
): CompoundEntry => ({
  id,
  type,
  difficulty,
  formula,
  names: {
    stock: Array.isArray(stock) ? stock : [stock],
    sistematica: Array.isArray(sistematica) ? sistematica : [sistematica],
    tradicional: Array.isArray(tradicional) ? tradicional : [tradicional],
  },
  explanation,
});

export const STUDY_GUIDE = [
  {
    title: 'Òxids',
    text: 'Combinen oxigen amb un altre element. En Stock s’anomena “òxid de …” i s’indica el nombre d’oxidació si l’element presenta diverses valències.',
  },
  {
    title: 'Hidrurs',
    text: 'Amb metalls s’anomenen com a hidrurs metàl·lics; amb no-metalls poden aparèixer noms tradicionals com àcid clorhídric o hidrur de fòsfor.',
  },
  {
    title: 'Hidròxids',
    text: 'Es reconeixen pel grup OH⁻. En formular, cal usar parèntesis si apareixen diversos grups hidròxid: Fe(OH)3, Ca(OH)2…',
  },
  {
    title: 'Sals binàries',
    text: 'Estan formades per un metall i un no-metall sense oxigen. Cal vigilar amb halurs, sulfurs i nitrurs, i amb les valències variables en Stock.',
  },
  {
    title: 'Hidràcids',
    text: 'Són àcids binaris sense oxigen, típics dels halògens i del sofre en dissolució aquosa: HCl, HBr, H2S…',
  },
  {
    title: 'Oxoàcids',
    text: 'Es formen a partir d’un no-metall, hidrogen i oxigen. Convé distingir bé sulfurós/sulfúric, nitrós/nítric, clorós/clòric, etc.',
  },
  {
    title: 'Oxosals',
    text: 'Provenen de substituir els hidrògens d’un oxoàcid per metalls. La terminació de l’anió ajuda: sulfit/sulfat, nitrit/nitrat, clorit/clorat…',
  },
  {
    title: 'Ions',
    text: 'Cal reconèixer i formular els ions més habituals de 1r de Batxillerat: cations metàl·lics i anions com clorur, sulfat, nitrat, hidròxid o amoni, sense entrar en casos estranys.',
  },
];

export const COMPOUNDS: CompoundEntry[] = [
  entry('fe2o3', 'oxidos_metalicos', 'facil', 'Fe2O3', 'òxid de ferro (III)', 'triòxid de diferro', 'òxid fèrric', 'El ferro puede tener +2 o +3. En Fe2O3 el ferro queda amb +3, por eso en Stock és òxid de ferro (III).'),
  entry('feo', 'oxidos_metalicos', 'facil', 'FeO', 'òxid de ferro (II)', 'monòxid de ferro', 'òxid ferrós', 'En FeO el ferro actua amb +2, així que en Stock se escribe òxid de ferro (II).'),
  entry('cu2o', 'oxidos_metalicos', 'facil', 'Cu2O', 'òxid de coure (I)', 'monòxid de dicoure', 'òxid cuprós', 'El coure presenta +1 y +2. En Cu2O correspon a l’estat +1.'),
  entry('cuo', 'oxidos_metalicos', 'facil', 'CuO', 'òxid de coure (II)', 'monòxid de coure', 'òxid cúpric', 'Aquí el coure és en +2, no en +1.'),
  entry('sno2', 'oxidos_metalicos', 'media', 'SnO2', 'òxid d\'estany (IV)', 'diòxid d\'estany', 'òxid estànnic', 'El estany té valències +2 y +4; con dos oxígenos resulta +4.'),
  entry('sno', 'oxidos_metalicos', 'media', 'SnO', 'òxid d\'estany (II)', 'monòxid d\'estany', 'òxid estanyso', 'En SnO el estany queda en +2.'),
  entry('pbo2', 'oxidos_metalicos', 'media', 'PbO2', 'òxid de plom (IV)', 'diòxid de plom', 'òxid plúmbic', 'El plom tiene +2 y +4; aquí el estado es +4.'),
  entry('pbo', 'oxidos_metalicos', 'media', 'PbO', 'òxid de plom (II)', 'monòxid de plom', 'òxid plumbós', 'En PbO el plom és en +2.'),
  entry('cr2o3', 'oxidos_metalicos', 'media', 'Cr2O3', 'òxid de crom (III)', 'triòxid de dicrom', 'òxid cròmic', 'El crom aquí és en +3.'),
  entry('mno2', 'oxidos_metalicos', 'dificil', 'MnO2', 'òxid de manganès (IV)', 'diòxid de manganès', 'òxid mangànic', 'En MnO2 el manganès vale +4.'),
  entry('co2o3', 'oxidos_metalicos', 'media', 'Co2O3', 'òxid de cobalt (III)', 'triòxid de dicobalt', 'òxid cobàltic', 'El cobalt puede variar y aquí es troba en +3.'),
  entry('hg2o', 'oxidos_metalicos', 'dificil', 'Hg2O', 'òxid de mercuri (I)', 'monòxid de dimercuri', 'òxid mercuriso', 'El mercuri(I) apareix com Hg2²⁺; por eso la fórmula correcta és Hg2O.'),
  entry('co', 'oxidos_no_metalicos', 'facil', 'CO', 'òxid de carboni (II)', 'monòxid de carboni', 'anhídrido carboniso', 'En CO el carboni tiene +2.'),
  entry('co2', 'oxidos_no_metalicos', 'facil', 'CO2', 'òxid de carboni (IV)', 'diòxid de carboni', 'anhídrido carbònic', 'CO2 correspon al òxid no metálico més comú del carboni.'),
  entry('so2', 'oxidos_no_metalicos', 'facil', 'SO2', 'òxid de sofre (IV)', 'diòxid de sofre', 'anhídrido sulfurso', 'Con dos oxígenos el sofre queda en +4, relacionat amb el àcid sulfurso.'),
  entry('so3', 'oxidos_no_metalicos', 'facil', 'SO3', 'òxid de sofre (VI)', 'triòxid de sofre', 'anhídrido sulfúric', 'SO3 conduce al àcid sulfúric y el sofre actua amb +6.'),
  entry('n2o3', 'oxidos_no_metalicos', 'media', 'N2O3', 'òxid de nitrogen (III)', 'triòxid de dinitrogen', 'anhídrido nitrós', 'El nitrogen és en +3.'),
  entry('n2o5', 'oxidos_no_metalicos', 'media', 'N2O5', 'òxid de nitrogen (V)', 'pentòxid de dinitrogen', 'anhídrido nítric', 'Aquest òxid está asociado al àcid nítric.'),
  entry('cl2o3', 'oxidos_no_metalicos', 'dificil', 'Cl2O3', 'òxid de cloro (III)', 'triòxid de dicloro', 'anhídrido clorós', 'Cl2O3 se relaciona con el àcid clorós.'),
  entry('cl2o5', 'oxidos_no_metalicos', 'dificil', 'Cl2O5', 'òxid de cloro (V)', 'pentòxid de dicloro', 'anhídrido clòric', 'El cloro queda en +5.'),
  entry('na2o2', 'peroxidos', 'media', 'Na2O2', 'peròxid de sodi', 'diòxid de disodi', 'peròxid de sodi', 'En los peròxids el oxígeno vale −1, no −2.'),
  entry('k2o2', 'peroxidos', 'media', 'K2O2', 'peròxid de potassi', 'diòxid de dipotassi', 'peròxid de potassi', 'K2O2 contiene el grupo peròxid O2²⁻.'),
  entry('bao2', 'peroxidos', 'media', 'BaO2', 'peròxid de bari', 'diòxid de bari', 'peròxid de bari', 'El bari es +2 y compensa l’anió peròxid O2²⁻.'),
  entry('h2o2', 'peroxidos', 'facil', 'H2O2', 'peròxid d\'hidrogen', 'diòxid de dihidrogen', 'aigua oxigenada', 'H2O2 és el peròxid més conegut; el oxígeno actua amb −1.'),
  entry('lih', 'hidruros_metalicos', 'facil', 'LiH', 'hidrur de liti', 'monohidrur de liti', 'hidrur de liti', 'En un hidrur metálico el hidrogen actua amb −1.'),
  entry('nah', 'hidruros_metalicos', 'facil', 'NaH', 'hidrur de sodi', 'monohidrur de sodi', 'hidrur de sodi', 'El sodi només presenta +1, por eso no porta número romano.'),
  entry('cah2', 'hidruros_metalicos', 'facil', 'CaH2', 'hidrur de calci', 'dihidrur de calci', 'hidrur de calci', 'El calci es +2 y necesita dos H⁻.'),
  entry('feh2', 'hidruros_metalicos', 'media', 'FeH2', 'hidrur de ferro (II)', 'dihidrur de ferro', 'hidrur ferrós', 'Con dos hidrurs, el ferro queda en +2.'),
  entry('feh3', 'hidruros_metalicos', 'media', 'FeH3', 'hidrur de ferro (III)', 'trihidrur de ferro', 'hidrur fèrric', 'En FeH3 el ferro actua amb +3.'),
  entry('cuh', 'hidruros_metalicos', 'media', 'CuH', 'hidrur de coure (I)', 'monohidrur de coure', 'hidrur cuprós', 'El coure aquí vale +1.'),
  entry('nh3', 'hidruros_no_metalicos', 'facil', 'NH3', 'hidrur de nitrogen (III)', 'trihidrur de nitrogen', 'amoníac', 'NH3 pot anomenar-se sistemáticamente como trihidrur de nitrogen y tradicionalment como amoníac.'),
  entry('ph3', 'hidruros_no_metalicos', 'media', 'PH3', 'hidrur de fòsfor (III)', 'trihidrur de fòsfor', 'fosfina', 'PH3 és un hidrur covalente; tradicionalment se usa fosfina.'),
  entry('hcl', 'hidruros_no_metalicos', 'facil', 'HCl', 'clorur d\'hidrogen', 'monoclorur d\'hidrogen', 'àcid clorhídric', 'Com a compost gasós pot anomenar-se clorur d\'hidrogen; en dissolució aquosa s’usa àcid clorhídric.'),
  entry('hbr', 'hidruros_no_metalicos', 'facil', 'HBr', 'bromur d\'hidrogen', 'monobromur d\'hidrogen', 'àcid bromhídric', 'Es un hidrur no metálico y també un hidràcid en disolución.'),
  entry('hi', 'hidruros_no_metalicos', 'media', 'HI', 'iodur d\'hidrogen', 'monoiodur d\'hidrogen', 'àcid iodhídric', 'El iode forma HI, que en agua rep el nom de àcid iodhídric.'),
  entry('caoh2', 'hidroxidos', 'facil', 'Ca(OH)2', 'hidròxid de calci', 'dihidròxid de calci', 'hidròxid càlcic', 'Hi ha dos grups OH⁻, por eso la fórmula porta paréntesis.'),
  entry('naoh', 'hidroxidos', 'facil', 'NaOH', 'hidròxid de sodi', 'monohidròxid de sodi', 'hidròxid sòdic', 'El sodi només té +1, així que n’hi ha prou amb un grupo OH⁻.'),
  entry('feoh2', 'hidroxidos', 'facil', 'Fe(OH)2', 'hidròxid de ferro (II)', 'dihidròxid de ferro', 'hidròxid ferrós', 'En Fe(OH)2 el ferro presenta +2.'),
  entry('feoh3', 'hidroxidos', 'facil', 'Fe(OH)3', 'hidròxid de ferro (III)', 'trihidròxid de ferro', 'hidròxid fèrric', 'Tres grups hidròxid compensen un ferro con +3.'),
  entry('cuoh2', 'hidroxidos', 'media', 'Cu(OH)2', 'hidròxid de coure (II)', 'dihidròxid de coure', 'hidròxid cúpric', 'El coure queda en +2.'),
  entry('snoh4', 'hidroxidos', 'dificil', 'Sn(OH)4', 'hidròxid d\'estany (IV)', 'tetrahidròxid d\'estany', 'hidròxid estànnic', 'Sn(OH)4 implica estany con valencia +4.'),
  entry('nacl', 'sales_binarias', 'facil', 'NaCl', 'clorur de sodi', 'monoclorur de sodi', 'clorur sòdic', 'Es una sal binaria entre Na⁺ y Cl⁻.'),
  entry('cacl2', 'sales_binarias', 'facil', 'CaCl2', 'clorur de calci', 'diclorur de calci', 'clorur càlcic', 'El calci es +2 y necesita dos clorurs.'),
  entry('cubr2', 'sales_binarias', 'facil', 'CuBr2', 'bromur de coure (II)', 'dibromur de coure', 'bromur cúpric', 'CuBr2 porta coure en +2.'),
  entry('cubr', 'sales_binarias', 'media', 'CuBr', 'bromur de coure (I)', 'monobromur de coure', 'bromur cuprós', 'Amb un bromur, el coure solo necesita +1.'),
  entry('fes', 'sales_binarias', 'facil', 'FeS', 'sulfur de ferro (II)', 'monosulfur de ferro', 'sulfur ferrós', 'L’anió sulfur es S²⁻; por eso el ferro aquí es +2.'),
  entry('fe2s3', 'sales_binarias', 'media', 'Fe2S3', 'sulfur de ferro (III)', 'trisulfur de diferro', 'sulfur fèrric', 'Tres sulfurs (−2) obligan a que cada ferro esté en +3.'),
  entry('aln', 'sales_binarias', 'media', 'AlN', 'nitrur d\'alumini', 'mononitrur d\'alumini', 'nitrur d\'alumini', 'El nitrogen en nitrurs actua amb −3.'),
  entry('ag2s', 'sales_binarias', 'media', 'Ag2S', 'sulfur de argent', 'monosulfur de diargent', 'sulfur de argent', 'La argent sol actuar con +1, por eso la fórmula es Ag2S.'),
  entry('h2s', 'hidrácidos', 'facil', 'H2S', 'sulfur d\'hidrogen', 'dihidrur de sofre', 'àcid sulfhídric', 'En aigua s’anomena com a àcid sulfhídric.'),
  entry('hcl_ac', 'hidrácidos', 'facil', 'HCl', 'clorur d\'hidrogen', 'monoclorur d\'hidrogen', 'àcid clorhídric', 'Como hidràcid, HCl se reconoce por el nombre tradicional àcid clorhídric.'),
  entry('hbr_ac', 'hidrácidos', 'facil', 'HBr', 'bromur d\'hidrogen', 'monobromur d\'hidrogen', 'àcid bromhídric', 'El bromur d\'hidrogen en disolución és el àcid bromhídric.'),
  entry('hi_ac', 'hidrácidos', 'media', 'HI', 'iodur d\'hidrogen', 'monoiodur d\'hidrogen', 'àcid iodhídric', 'HI en disolución rep el nom de àcid iodhídric.'),
  entry('hf_ac', 'hidrácidos', 'media', 'HF', 'fluorur d\'hidrogen', 'monofluorur d\'hidrogen', 'àcid fluorhídric', 'HF és un hidràcid d’examen molt freqüent.'),
  entry('h2so4', 'oxoacidos', 'facil', 'H2SO4', 'àcid tetraoxosulfúric (VI)', 'tetraoxosulfat de dihidrogen', 'àcid sulfúric', 'El sofre és en +6 y l’anió relacionado es sulfat.'),
  entry('h2so3', 'oxoacidos', 'facil', 'H2SO3', 'àcid trioxosulfúric (IV)', 'trioxosulfat de dihidrogen', 'àcid sulfurso', 'SO3²⁻ es sulfit; por eso el àcid es sulfurso, no sulfúric.'),
  entry('hno3', 'oxoacidos', 'facil', 'HNO3', 'àcid trioxonítric (V)', 'trioxonitrat d\'hidrogen', 'àcid nítric', 'El nitrogen es troba en +5.'),
  entry('hno2', 'oxoacidos', 'facil', 'HNO2', 'àcid dioxonítric (III)', 'dioxonitrit d\'hidrogen', 'àcid nitrós', 'NO2⁻ és nitrit; per això l’àcid és nitrós.'),
  entry('h2co3', 'oxoacidos', 'facil', 'H2CO3', 'àcid trioxocarbònic (IV)', 'trioxocarbonat de dihidrogen', 'àcid carbònic', 'Se forma a partir dl’anió carbonat.'),
  entry('hclo', 'oxoacidos', 'media', 'HClO', 'àcid oxoclorós (I)', 'oxoclorat d\'hidrogen', 'àcid hipoclorós', 'En la sèrie del clor, HClO és hipoclorós.'),
  entry('hclo2', 'oxoacidos', 'media', 'HClO2', 'àcid dioxoclorós (III)', 'dioxoclorat d\'hidrogen', 'àcid clorós', 'Un oxigen més que l’hipoclorós dona àcid clorós.'),
  entry('hclo3', 'oxoacidos', 'media', 'HClO3', 'àcid trioxoclòric (V)', 'trioxoclorat d\'hidrogen', 'àcid clòric', 'HClO3 està associat a l’anió clorat.'),
  entry('hclo4', 'oxoacidos', 'dificil', 'HClO4', 'àcid tetraoxoclòric (VII)', 'tetraoxoclorat d\'hidrogen', 'àcid perclòric', 'Amb el clor en +7 apareix el prefix per-.'),
  entry('h3po4', 'oxoacidos', 'facil', 'H3PO4', 'àcid tetraoxofosfòric (V)', 'tetraoxofosfat de trihidrogen', 'àcid fosfòric', 'El fòsfor és en +5.'),
  entry('h2cro4', 'oxoacidos', 'dificil', 'H2CrO4', 'àcid tetraoxocròmic (VI)', 'tetraoxocromat de dihidrogen', 'àcid cròmic', 'L’anió relacionat és cromat, con crom en +6.'),
  entry('na2so4', 'oxosales', 'facil', 'Na2SO4', 'sulfat de sodi', 'tetraoxosulfat (VI) de disodi', 'sulfat de sodi', 'SO4²⁻ és sulfat, no sulfit.'),
  entry('na2so3', 'oxosales', 'facil', 'Na2SO3', 'sulfit de sodi', 'trioxosulfat (IV) de disodi', 'sulfit de sodi', 'SO3²⁻ es sulfit; un oxigen menys que el sulfat.'),
  entry('cano32', 'oxosales', 'facil', 'Ca(NO3)2', 'nitrat de calci', 'trioxonitrat (V) de calci', 'nitrat càlcic', 'L’anió NO3⁻ és nitrat.'),
  entry('cano22', 'oxosales', 'facil', 'Ca(NO2)2', 'nitrit de calci', 'dioxonitrit (III) de calci', 'nitrit càlcic', 'NO2⁻ és nitrit, no nitrat.'),
  entry('kclo3', 'oxosales', 'facil', 'KClO3', 'clorat de potassi', 'trioxoclorat (V) de potassi', 'clorat potàssic', 'ClO3⁻ és clorat.'),
  entry('kclo2', 'oxosales', 'media', 'KClO2', 'clorit de potassi', 'dioxoclorat (III) de potassi', 'clorit potàssic', 'ClO2⁻ es clorit, un nivell per sota del clorat.'),
  entry('naclo', 'oxosales', 'media', 'NaClO', 'hipoclorit de sodi', 'oxoclorat (I) de sodi', 'hipoclorit sòdic', 'ClO⁻ correspon al hipoclorit.'),
  entry('naclo4', 'oxosales', 'dificil', 'NaClO4', 'perclorat de sodi', 'tetraoxoclorat (VII) de sodi', 'perclorat sòdic', 'ClO4⁻ és el perclorat.'),
  entry('al2so43', 'oxosales', 'media', 'Al2(SO4)3', 'sulfat d\'alumini', 'tetraoxosulfat (VI) de dialumini', 'sulfat d\'alumini', 'L’alumini és +3 i per això es combinen tres sulfats amb dos Al³⁺.'),
  entry('fe2so43', 'oxosales', 'media', 'Fe2(SO4)3', 'sulfat de ferro (III)', 'tetraoxosulfat (VI) de diferro', 'sulfat fèrric', 'El ferro va en +3.'),
  entry('feno32', 'oxosales', 'media', 'Fe(NO3)2', 'nitrat de ferro (II)', 'trioxonitrat (V) de ferro', 'nitrat ferrós', 'Dos nitrats compensen el ferro (II).'),
  entry('cuso4', 'oxosales', 'media', 'CuSO4', 'sulfat de coure (II)', 'tetraoxosulfat (VI) de coure', 'sulfat cúpric', 'El coure aquí és en +2.'),
  entry('na2co3', 'oxosales', 'facil', 'Na2CO3', 'carbonat de sodi', 'trioxocarbonat (IV) de disodi', 'carbonat sòdic', 'CO3²⁻ es l’anió carbonat.'),
  entry('kmnO4', 'oxosales', 'dificil', 'KMnO4', 'permanganat de potassi', 'tetraoxomanganato (VII) de potassi', 'permanganat potàssic', 'El manganès és en +7 en l’anió permanganat.'),
  entry('nahso4', 'sales_acidas', 'media', 'NaHSO4', 'hidrogenosulfat de sodi', 'hidrogenotetraoxosulfat (VI) de sodi', 'bisulfat de sodi', 'NaHSO4 conserva un hidrogen àcid de l’àcid sulfúric.'),
  entry('nahco3', 'sales_acidas', 'facil', 'NaHCO3', 'hidrogenocarbonat de sodi', 'hidrogenotrioxocarbonat (IV) de sodi', 'bicarbonat de sodi', 'També s’accepta bicarbonat en tradicional.'),
  entry('khso3', 'sales_acidas', 'media', 'KHSO3', 'hidrogenosulfit de potassi', 'hidrogenotrioxosulfat (IV) de potassi', 'bisulfit de potassi', 'En provenir del sulfit, el nombre correcto es hidrogenosulfit.'),
  entry('nah2po4', 'sales_acidas', 'dificil', 'NaH2PO4', 'dihidrogenofosfat de sodi', 'dihidrogenotetraoxofosfat (V) de sodi', 'fosfat àcid de sodi', 'Quedan dos hidrogens del àcid fosfòric.'),
  entry('ca(hco3)2', 'sales_acidas', 'dificil', 'Ca(HCO3)2', 'hidrogenocarbonat de calci', 'bis[hidrogenotrioxocarbonat (IV)] de calci', 'bicarbonat de calci', 'El calci es +2, per això necessita dos aniones hidrogenocarbonat.'),
  entry('nh4cl', 'amonio', 'facil', 'NH4Cl', 'clorur d\'amonio', 'clorur d\'amonio', 'clorur amònic', 'NH4⁺ és el catió amoni.'),
  entry('nh42so4', 'amonio', 'media', '(NH4)2SO4', 'sulfat d\'amonio', 'tetraoxosulfat (VI) de diamoni', 'sulfat amònic', 'Com que hi ha dos grups amoni, s’utilitzen parèntesis.'),
  entry('nh4no3', 'amonio', 'media', 'NH4NO3', 'nitrat d\'amonio', 'trioxonitrat (V) d\'amonio', 'nitrat amònic', 'Combina el catió amoni con l’anió nitrat.'),
  entry('nh42s', 'amonio', 'media', '(NH4)2S', 'sulfur d\'amonio', 'sulfur de diamoni', 'sulfur amònic', 'L’anió sulfur es S²⁻, por eso calen dos NH4⁺.'),
  entry('nh4hco3', 'amonio', 'dificil', 'NH4HCO3', 'hidrogenocarbonat d\'amonio', 'hidrogenotrioxocarbonat (IV) d\'amonio', 'bicarbonat d\'amonio', 'És una sal àcida del catió amoni.'),
  entry('nh4clo4', 'amonio', 'dificil', 'NH4ClO4', 'perclorat d\'amonio', 'tetraoxoclorat (VII) d\'amonio', 'perclorat amònic', 'Combina NH4⁺ con l’anió perclorat.'),
  entry('na_ion', 'iones', 'facil', 'Na+', 'ió sodi', 'catió sodi', 'ió sodi', 'El sodi forma el catió Na+ amb càrrega +1.'),
  entry('ca_ion', 'iones', 'facil', 'Ca2+', 'ió calci', 'catió calci', 'ió calci', 'El calci forma el catió Ca2+.'),
  entry('fe2_ion', 'iones', 'media', 'Fe2+', 'ió ferro (II)', 'catió ferro (II)', 'ió ferrós', 'El ferro pot formar Fe2+ i Fe3+; aquí correspon Fe2+.'),
  entry('fe3_ion', 'iones', 'media', 'Fe3+', 'ió ferro (III)', 'catió ferro (III)', 'ió fèrric', 'Fe3+ és el catió ferro(III).'),
  entry('cu_ion', 'iones', 'media', 'Cu2+', 'ió coure (II)', 'catió coure (II)', 'ió cúpric', 'El coure(II) forma Cu2+.'),
  entry('nh4_ion', 'iones', 'facil', 'NH4+', 'ió amoni', 'catió amoni', 'ió amoni', 'NH4+ és el catió amoni.'),
  entry('cl_ion', 'iones', 'facil', 'Cl-', 'ió clorur', 'anió clorur', 'ió clorur', 'El clorur és l’anió Cl-.'),
  entry('oh_ion', 'iones', 'facil', 'OH-', 'ió hidròxid', 'anió hidròxid', 'ió hidròxid', 'L’ió hidròxid és OH-.'),
  entry('no3_ion', 'iones', 'facil', 'NO3-', 'ió nitrat', 'anió nitrat', 'ió nitrat', 'NO3- és l’anió nitrat.'),
  entry('so4_ion', 'iones', 'facil', 'SO4^2-', 'ió sulfat', 'anió sulfat', 'ió sulfat', 'SO4^2- és l’anió sulfat, amb càrrega -2.'),
  entry('co3_ion', 'iones', 'facil', 'CO3^2-', 'ió carbonat', 'anió carbonat', 'ió carbonat', 'CO3^2- és l’anió carbonat.'),
  entry('po4_ion', 'iones', 'media', 'PO4^3-', 'ió fosfat', 'anió fosfat', 'ió fosfat', 'PO4^3- és l’anió fosfat, amb càrrega -3.'),
];

export const DEFAULT_SETTINGS = {
  activeTypes: ['oxidos_metalicos', 'oxidos_no_metalicos', 'hidruros_metalicos', 'hidruros_no_metalicos', 'hidroxidos', 'sales_binarias', 'hidrácidos', 'oxoacidos', 'oxosales', 'iones'] as CompoundType[],
  activeNomenclatures: ['stock', 'sistematica', 'tradicional'] as Nomenclature[],
  difficulty: 'media' as Difficulty,
  examMinutes: 35,
  autoCorrection: true,
  autoExplanation: true,
  acceptAccentsOptional: true,
  timerEnabled: true,
};
