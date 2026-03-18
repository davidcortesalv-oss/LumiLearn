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
  | 'amonio';

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
  oxidos_metalicos: 'Óxidos metálicos',
  oxidos_no_metalicos: 'Óxidos no metálicos',
  peroxidos: 'Peróxidos',
  hidruros_metalicos: 'Hidruros metálicos',
  hidruros_no_metalicos: 'Hidruros no metálicos',
  hidroxidos: 'Hidróxidos',
  sales_binarias: 'Sales binarias',
  'hidrácidos': 'Hidrácidos',
  oxoacidos: 'Oxoácidos',
  oxosales: 'Oxosales',
  sales_acidas: 'Sales ácidas',
  amonio: 'Sales con ion amonio',
};

export const NOMENCLATURE_LABELS: Record<Nomenclature, string> = {
  stock: 'Stock',
  sistematica: 'Sistemática',
  tradicional: 'Tradicional',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
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
    title: 'Óxidos',
    text: 'Combinan oxígeno con otro elemento. En Stock se nombra “óxido de …” y se indica el número de oxidación si el elemento presenta varias valencias.',
  },
  {
    title: 'Peróxidos',
    text: 'Contienen el anión O2²⁻; el oxígeno actúa con −1. Suelen confundirse con óxidos normales, así que conviene comprobar la proporción del oxígeno.',
  },
  {
    title: 'Hidruros',
    text: 'Con metales se nombran como hidruros metálicos; con no metales pueden aparecer nombres tradicionales como ácido clorhídrico o hidruro de fósforo.',
  },
  {
    title: 'Hidróxidos',
    text: 'Se reconocen por el grupo OH⁻. Al formular, hay que usar paréntesis si aparecen varios grupos hidróxido: Fe(OH)3, Ca(OH)2…',
  },
  {
    title: 'Sales binarias',
    text: 'Están formadas por un metal y un no metal sin oxígeno. Ojo con haluros, sulfuros y nitruros, y con las valencias variables en Stock.',
  },
  {
    title: 'Hidrácidos',
    text: 'Son ácidos binarios sin oxígeno, típicos de los halógenos y del azufre en disolución acuosa: HCl, HBr, H2S…',
  },
  {
    title: 'Oxoácidos',
    text: 'Se forman a partir de un no metal, hidrógeno y oxígeno. Conviene distinguir bien sulfuroso/sulfúrico, nitroso/nítrico, cloroso/clórico, etc.',
  },
  {
    title: 'Oxosales',
    text: 'Proceden de sustituir los hidrógenos de un oxoácido por metales. La terminación del anión ayuda: sulfito/sulfato, nitrito/nitrato, clorito/clorato…',
  },
  {
    title: 'Sales ácidas',
    text: 'Todavía conservan hidrógeno en el anión: NaHSO4, KHCO3… Se nombran como hidrogenosulfato, hidrogenocarbonato, etc.',
  },
  {
    title: 'Amonio',
    text: 'El catión NH4⁺ funciona como un ion positivo poliatómico. Deben aparecer paréntesis cuando se repite: (NH4)2SO4.',
  },
];

export const COMPOUNDS: CompoundEntry[] = [
  entry('fe2o3', 'oxidos_metalicos', 'facil', 'Fe2O3', 'óxido de hierro (III)', 'trióxido de dihierro', 'óxido férrico', 'El hierro puede tener +2 o +3. En Fe2O3 el hierro queda con +3, por eso en Stock es óxido de hierro (III).'),
  entry('feo', 'oxidos_metalicos', 'facil', 'FeO', 'óxido de hierro (II)', 'monóxido de hierro', 'óxido ferroso', 'En FeO el hierro actúa con +2, así que en Stock se escribe óxido de hierro (II).'),
  entry('cu2o', 'oxidos_metalicos', 'facil', 'Cu2O', 'óxido de cobre (I)', 'monóxido de dicobre', 'óxido cuproso', 'El cobre presenta +1 y +2. En Cu2O corresponde el estado +1.'),
  entry('cuo', 'oxidos_metalicos', 'facil', 'CuO', 'óxido de cobre (II)', 'monóxido de cobre', 'óxido cúprico', 'Aquí el cobre está en +2, no en +1.'),
  entry('sno2', 'oxidos_metalicos', 'media', 'SnO2', 'óxido de estaño (IV)', 'dióxido de estaño', 'óxido estañico', 'El estaño tiene valencias +2 y +4; con dos oxígenos resulta +4.'),
  entry('sno', 'oxidos_metalicos', 'media', 'SnO', 'óxido de estaño (II)', 'monóxido de estaño', 'óxido estañoso', 'En SnO el estaño queda en +2.'),
  entry('pbo2', 'oxidos_metalicos', 'media', 'PbO2', 'óxido de plomo (IV)', 'dióxido de plomo', 'óxido plúmbico', 'El plomo tiene +2 y +4; aquí el estado es +4.'),
  entry('pbo', 'oxidos_metalicos', 'media', 'PbO', 'óxido de plomo (II)', 'monóxido de plomo', 'óxido plumboso', 'En PbO el plomo está en +2.'),
  entry('cr2o3', 'oxidos_metalicos', 'media', 'Cr2O3', 'óxido de cromo (III)', 'trióxido de dicromo', 'óxido crómico', 'El cromo aquí está en +3.'),
  entry('mno2', 'oxidos_metalicos', 'dificil', 'MnO2', 'óxido de manganeso (IV)', 'dióxido de manganeso', 'óxido mangánico', 'En MnO2 el manganeso vale +4.'),
  entry('co2o3', 'oxidos_metalicos', 'media', 'Co2O3', 'óxido de cobalto (III)', 'trióxido de dicobalto', 'óxido cobáltico', 'El cobalto puede variar y aquí se encuentra en +3.'),
  entry('hg2o', 'oxidos_metalicos', 'dificil', 'Hg2O', 'óxido de mercurio (I)', 'monóxido de dimercurio', 'óxido mercurioso', 'El mercurio(I) aparece como Hg2²⁺; por eso la fórmula correcta es Hg2O.'),
  entry('co', 'oxidos_no_metalicos', 'facil', 'CO', 'óxido de carbono (II)', 'monóxido de carbono', 'anhídrido carbonoso', 'En CO el carbono tiene +2.'),
  entry('co2', 'oxidos_no_metalicos', 'facil', 'CO2', 'óxido de carbono (IV)', 'dióxido de carbono', 'anhídrido carbónico', 'CO2 corresponde al óxido no metálico más común del carbono.'),
  entry('so2', 'oxidos_no_metalicos', 'facil', 'SO2', 'óxido de azufre (IV)', 'dióxido de azufre', 'anhídrido sulfuroso', 'Con dos oxígenos el azufre queda en +4, relacionado con el ácido sulfuroso.'),
  entry('so3', 'oxidos_no_metalicos', 'facil', 'SO3', 'óxido de azufre (VI)', 'trióxido de azufre', 'anhídrido sulfúrico', 'SO3 conduce al ácido sulfúrico y el azufre actúa con +6.'),
  entry('n2o3', 'oxidos_no_metalicos', 'media', 'N2O3', 'óxido de nitrógeno (III)', 'trióxido de dinitrógeno', 'anhídrido nitroso', 'El nitrógeno está en +3.'),
  entry('n2o5', 'oxidos_no_metalicos', 'media', 'N2O5', 'óxido de nitrógeno (V)', 'pentóxido de dinitrógeno', 'anhídrido nítrico', 'Este óxido está asociado al ácido nítrico.'),
  entry('cl2o3', 'oxidos_no_metalicos', 'dificil', 'Cl2O3', 'óxido de cloro (III)', 'trióxido de dicloro', 'anhídrido cloroso', 'Cl2O3 se relaciona con el ácido cloroso.'),
  entry('cl2o5', 'oxidos_no_metalicos', 'dificil', 'Cl2O5', 'óxido de cloro (V)', 'pentóxido de dicloro', 'anhídrido clórico', 'El cloro queda en +5.'),
  entry('na2o2', 'peroxidos', 'media', 'Na2O2', 'peróxido de sodio', 'dióxido de disodio', 'peróxido de sodio', 'En los peróxidos el oxígeno vale −1, no −2.'),
  entry('k2o2', 'peroxidos', 'media', 'K2O2', 'peróxido de potasio', 'dióxido de dipotasio', 'peróxido de potasio', 'K2O2 contiene el grupo peróxido O2²⁻.'),
  entry('bao2', 'peroxidos', 'media', 'BaO2', 'peróxido de bario', 'dióxido de bario', 'peróxido de bario', 'El bario es +2 y compensa el anión peróxido O2²⁻.'),
  entry('h2o2', 'peroxidos', 'facil', 'H2O2', 'peróxido de hidrógeno', 'dióxido de dihidrógeno', 'agua oxigenada', 'H2O2 es el peróxido más conocido; el oxígeno actúa con −1.'),
  entry('lih', 'hidruros_metalicos', 'facil', 'LiH', 'hidruro de litio', 'monohidruro de litio', 'hidruro de litio', 'En un hidruro metálico el hidrógeno actúa con −1.'),
  entry('nah', 'hidruros_metalicos', 'facil', 'NaH', 'hidruro de sodio', 'monohidruro de sodio', 'hidruro de sodio', 'El sodio solo presenta +1, por eso no lleva número romano.'),
  entry('cah2', 'hidruros_metalicos', 'facil', 'CaH2', 'hidruro de calcio', 'dihidruro de calcio', 'hidruro de calcio', 'El calcio es +2 y necesita dos H⁻.'),
  entry('feh2', 'hidruros_metalicos', 'media', 'FeH2', 'hidruro de hierro (II)', 'dihidruro de hierro', 'hidruro ferroso', 'Con dos hidruros, el hierro queda en +2.'),
  entry('feh3', 'hidruros_metalicos', 'media', 'FeH3', 'hidruro de hierro (III)', 'trihidruro de hierro', 'hidruro férrico', 'En FeH3 el hierro actúa con +3.'),
  entry('cuh', 'hidruros_metalicos', 'media', 'CuH', 'hidruro de cobre (I)', 'monohidruro de cobre', 'hidruro cuproso', 'El cobre aquí vale +1.'),
  entry('nh3', 'hidruros_no_metalicos', 'facil', 'NH3', 'hidruro de nitrógeno (III)', 'trihidruro de nitrógeno', 'amoniaco', 'NH3 puede nombrarse sistemáticamente como trihidruro de nitrógeno y tradicionalmente como amoniaco.'),
  entry('ph3', 'hidruros_no_metalicos', 'media', 'PH3', 'hidruro de fósforo (III)', 'trihidruro de fósforo', 'fosfina', 'PH3 es un hidruro covalente; tradicionalmente se usa fosfina.'),
  entry('hcl', 'hidruros_no_metalicos', 'facil', 'HCl', 'cloruro de hidrógeno', 'monocloruro de hidrógeno', 'ácido clorhídrico', 'Como compuesto gaseoso puede llamarse cloruro de hidrógeno; en disolución acuosa se usa ácido clorhídrico.'),
  entry('hbr', 'hidruros_no_metalicos', 'facil', 'HBr', 'bromuro de hidrógeno', 'monobromuro de hidrógeno', 'ácido bromhídrico', 'Es un hidruro no metálico y también un hidrácido en disolución.'),
  entry('hi', 'hidruros_no_metalicos', 'media', 'HI', 'yoduro de hidrógeno', 'monoyoduro de hidrógeno', 'ácido yodhídrico', 'El yodo forma HI, que en agua recibe el nombre de ácido yodhídrico.'),
  entry('caoh2', 'hidroxidos', 'facil', 'Ca(OH)2', 'hidróxido de calcio', 'dihidróxido de calcio', 'hidróxido cálcico', 'Hay dos grupos OH⁻, por eso la fórmula lleva paréntesis.'),
  entry('naoh', 'hidroxidos', 'facil', 'NaOH', 'hidróxido de sodio', 'monohidróxido de sodio', 'hidróxido sódico', 'El sodio solo tiene +1, así que basta con un grupo OH⁻.'),
  entry('feoh2', 'hidroxidos', 'facil', 'Fe(OH)2', 'hidróxido de hierro (II)', 'dihidróxido de hierro', 'hidróxido ferroso', 'En Fe(OH)2 el hierro presenta +2.'),
  entry('feoh3', 'hidroxidos', 'facil', 'Fe(OH)3', 'hidróxido de hierro (III)', 'trihidróxido de hierro', 'hidróxido férrico', 'Tres grupos hidróxido compensan un hierro con +3.'),
  entry('cuoh2', 'hidroxidos', 'media', 'Cu(OH)2', 'hidróxido de cobre (II)', 'dihidróxido de cobre', 'hidróxido cúprico', 'El cobre queda en +2.'),
  entry('snoh4', 'hidroxidos', 'dificil', 'Sn(OH)4', 'hidróxido de estaño (IV)', 'tetrahidróxido de estaño', 'hidróxido estañico', 'Sn(OH)4 implica estaño con valencia +4.'),
  entry('nacl', 'sales_binarias', 'facil', 'NaCl', 'cloruro de sodio', 'monocloruro de sodio', 'cloruro sódico', 'Es una sal binaria entre Na⁺ y Cl⁻.'),
  entry('cacl2', 'sales_binarias', 'facil', 'CaCl2', 'cloruro de calcio', 'dicloruro de calcio', 'cloruro cálcico', 'El calcio es +2 y necesita dos cloruros.'),
  entry('cubr2', 'sales_binarias', 'facil', 'CuBr2', 'bromuro de cobre (II)', 'dibromuro de cobre', 'bromuro cúprico', 'CuBr2 lleva cobre en +2.'),
  entry('cubr', 'sales_binarias', 'media', 'CuBr', 'bromuro de cobre (I)', 'monobromuro de cobre', 'bromuro cuproso', 'Con un bromuro, el cobre solo necesita +1.'),
  entry('fes', 'sales_binarias', 'facil', 'FeS', 'sulfuro de hierro (II)', 'monosulfuro de hierro', 'sulfuro ferroso', 'El anión sulfuro es S²⁻; por eso el hierro aquí es +2.'),
  entry('fe2s3', 'sales_binarias', 'media', 'Fe2S3', 'sulfuro de hierro (III)', 'trisulfuro de dihierro', 'sulfuro férrico', 'Tres sulfuros (−2) obligan a que cada hierro esté en +3.'),
  entry('aln', 'sales_binarias', 'media', 'AlN', 'nitruro de aluminio', 'mononitruro de aluminio', 'nitruro de aluminio', 'El nitrógeno en nitruros actúa con −3.'),
  entry('ag2s', 'sales_binarias', 'media', 'Ag2S', 'sulfuro de plata', 'monosulfuro de diplata', 'sulfuro de plata', 'La plata suele actuar con +1, por eso la fórmula es Ag2S.'),
  entry('h2s', 'hidrácidos', 'facil', 'H2S', 'sulfuro de hidrógeno', 'dihidruro de azufre', 'ácido sulfhídrico', 'En agua se nombra como ácido sulfhídrico.'),
  entry('hcl_ac', 'hidrácidos', 'facil', 'HCl', 'cloruro de hidrógeno', 'monocloruro de hidrógeno', 'ácido clorhídrico', 'Como hidrácido, HCl se reconoce por el nombre tradicional ácido clorhídrico.'),
  entry('hbr_ac', 'hidrácidos', 'facil', 'HBr', 'bromuro de hidrógeno', 'monobromuro de hidrógeno', 'ácido bromhídrico', 'El bromuro de hidrógeno en disolución es el ácido bromhídrico.'),
  entry('hi_ac', 'hidrácidos', 'media', 'HI', 'yoduro de hidrógeno', 'monoyoduro de hidrógeno', 'ácido yodhídrico', 'HI en disolución recibe el nombre de ácido yodhídrico.'),
  entry('hf_ac', 'hidrácidos', 'media', 'HF', 'fluoruro de hidrógeno', 'monofluoruro de hidrógeno', 'ácido fluorhídrico', 'HF es un hidrácido de examen muy frecuente.'),
  entry('h2so4', 'oxoacidos', 'facil', 'H2SO4', 'ácido tetraoxosulfúrico (VI)', 'tetraoxosulfato de dihidrógeno', 'ácido sulfúrico', 'El azufre está en +6 y el anión relacionado es sulfato.'),
  entry('h2so3', 'oxoacidos', 'facil', 'H2SO3', 'ácido trioxosulfúrico (IV)', 'trioxosulfato de dihidrógeno', 'ácido sulfuroso', 'SO3²⁻ es sulfito; por eso el ácido es sulfuroso, no sulfúrico.'),
  entry('hno3', 'oxoacidos', 'facil', 'HNO3', 'ácido trioxonítrico (V)', 'trioxonitrato de hidrógeno', 'ácido nítrico', 'El nitrógeno se encuentra en +5.'),
  entry('hno2', 'oxoacidos', 'facil', 'HNO2', 'ácido dioxonítrico (III)', 'dioxonitrito de hidrógeno', 'ácido nitroso', 'NO2⁻ es nitrito, por eso el ácido es nitroso.'),
  entry('h2co3', 'oxoacidos', 'facil', 'H2CO3', 'ácido trioxocarbónico (IV)', 'trioxocarbonato de dihidrógeno', 'ácido carbónico', 'Se forma a partir del anión carbonato.'),
  entry('hclo', 'oxoacidos', 'media', 'HClO', 'ácido oxocloroso (I)', 'oxoclorato de hidrógeno', 'ácido hipocloroso', 'En la serie del cloro, HClO es hipocloroso.'),
  entry('hclo2', 'oxoacidos', 'media', 'HClO2', 'ácido dioxocloroso (III)', 'dioxoclorato de hidrógeno', 'ácido cloroso', 'Un oxígeno más que el hipocloroso da ácido cloroso.'),
  entry('hclo3', 'oxoacidos', 'media', 'HClO3', 'ácido trioxoclórico (V)', 'trioxoclorato de hidrógeno', 'ácido clórico', 'HClO3 está asociado al anión clorato.'),
  entry('hclo4', 'oxoacidos', 'dificil', 'HClO4', 'ácido tetraoxoclórico (VII)', 'tetraoxoclorato de hidrógeno', 'ácido perclórico', 'Con el cloro en +7 aparece el prefijo per-.'),
  entry('h3po4', 'oxoacidos', 'facil', 'H3PO4', 'ácido tetraoxofosfórico (V)', 'tetraoxofosfato de trihidrógeno', 'ácido fosfórico', 'El fósforo está en +5.'),
  entry('h2cro4', 'oxoacidos', 'dificil', 'H2CrO4', 'ácido tetraoxocrómico (VI)', 'tetraoxocromato de dihidrógeno', 'ácido crómico', 'El anión relacionado es cromato, con cromo en +6.'),
  entry('na2so4', 'oxosales', 'facil', 'Na2SO4', 'sulfato de sodio', 'tetraoxosulfato (VI) de disodio', 'sulfato de sodio', 'SO4²⁻ es sulfato, no sulfito.'),
  entry('na2so3', 'oxosales', 'facil', 'Na2SO3', 'sulfito de sodio', 'trioxosulfato (IV) de disodio', 'sulfito de sodio', 'SO3²⁻ es sulfito; un oxígeno menos que el sulfato.'),
  entry('cano32', 'oxosales', 'facil', 'Ca(NO3)2', 'nitrato de calcio', 'trioxonitrato (V) de calcio', 'nitrato cálcico', 'El anión NO3⁻ es nitrato.'),
  entry('cano22', 'oxosales', 'facil', 'Ca(NO2)2', 'nitrito de calcio', 'dioxonitrito (III) de calcio', 'nitrito cálcico', 'NO2⁻ es nitrito, no nitrato.'),
  entry('kclo3', 'oxosales', 'facil', 'KClO3', 'clorato de potasio', 'trioxoclorato (V) de potasio', 'clorato potásico', 'ClO3⁻ es clorato.'),
  entry('kclo2', 'oxosales', 'media', 'KClO2', 'clorito de potasio', 'dioxoclorato (III) de potasio', 'clorito potásico', 'ClO2⁻ es clorito, un nivel por debajo del clorato.'),
  entry('naclo', 'oxosales', 'media', 'NaClO', 'hipoclorito de sodio', 'oxoclorato (I) de sodio', 'hipoclorito sódico', 'ClO⁻ corresponde al hipoclorito.'),
  entry('naclo4', 'oxosales', 'dificil', 'NaClO4', 'perclorato de sodio', 'tetraoxoclorato (VII) de sodio', 'perclorato sódico', 'ClO4⁻ es el perclorato.'),
  entry('al2so43', 'oxosales', 'media', 'Al2(SO4)3', 'sulfato de aluminio', 'tetraoxosulfato (VI) de dialuminio', 'sulfato de aluminio', 'El aluminio es +3 y por eso se combinan tres sulfatos con dos Al³⁺.'),
  entry('fe2so43', 'oxosales', 'media', 'Fe2(SO4)3', 'sulfato de hierro (III)', 'tetraoxosulfato (VI) de dihierro', 'sulfato férrico', 'El hierro va en +3.'),
  entry('feno32', 'oxosales', 'media', 'Fe(NO3)2', 'nitrato de hierro (II)', 'trioxonitrato (V) de hierro', 'nitrato ferroso', 'Dos nitratos compensan al hierro (II).'),
  entry('cuso4', 'oxosales', 'media', 'CuSO4', 'sulfato de cobre (II)', 'tetraoxosulfato (VI) de cobre', 'sulfato cúprico', 'El cobre aquí está en +2.'),
  entry('na2co3', 'oxosales', 'facil', 'Na2CO3', 'carbonato de sodio', 'trioxocarbonato (IV) de disodio', 'carbonato sódico', 'CO3²⁻ es el anión carbonato.'),
  entry('kmnO4', 'oxosales', 'dificil', 'KMnO4', 'permanganato de potasio', 'tetraoxomanganato (VII) de potasio', 'permanganato potásico', 'El manganeso está en +7 en el anión permanganato.'),
  entry('nahso4', 'sales_acidas', 'media', 'NaHSO4', 'hidrogenosulfato de sodio', 'hidrogenotetraoxosulfato (VI) de sodio', 'bisulfato de sodio', 'NaHSO4 conserva un hidrógeno ácido del ácido sulfúrico.'),
  entry('nahco3', 'sales_acidas', 'facil', 'NaHCO3', 'hidrogenocarbonato de sodio', 'hidrogenotrioxocarbonato (IV) de sodio', 'bicarbonato de sodio', 'También se acepta bicarbonato en tradicional.'),
  entry('khso3', 'sales_acidas', 'media', 'KHSO3', 'hidrogenosulfito de potasio', 'hidrogenotrioxosulfato (IV) de potasio', 'bisulfito de potasio', 'Al provenir del sulfito, el nombre correcto es hidrogenosulfito.'),
  entry('nah2po4', 'sales_acidas', 'dificil', 'NaH2PO4', 'dihidrogenofosfato de sodio', 'dihidrogenotetraoxofosfato (V) de sodio', 'fosfato ácido de sodio', 'Quedan dos hidrógenos del ácido fosfórico.'),
  entry('ca(hco3)2', 'sales_acidas', 'dificil', 'Ca(HCO3)2', 'hidrogenocarbonato de calcio', 'bis[hidrogenotrioxocarbonato (IV)] de calcio', 'bicarbonato de calcio', 'El calcio es +2, por eso necesita dos aniones hidrogenocarbonato.'),
  entry('nh4cl', 'amonio', 'facil', 'NH4Cl', 'cloruro de amonio', 'cloruro de amonio', 'cloruro amónico', 'NH4⁺ es el catión amonio.'),
  entry('nh42so4', 'amonio', 'media', '(NH4)2SO4', 'sulfato de amonio', 'tetraoxosulfato (VI) de diamonio', 'sulfato amónico', 'Como hay dos grupos amonio, se usan paréntesis.'),
  entry('nh4no3', 'amonio', 'media', 'NH4NO3', 'nitrato de amonio', 'trioxonitrato (V) de amonio', 'nitrato amónico', 'Combina el catión amonio con el anión nitrato.'),
  entry('nh42s', 'amonio', 'media', '(NH4)2S', 'sulfuro de amonio', 'sulfuro de diamonio', 'sulfuro amónico', 'El anión sulfuro es S²⁻, por eso se necesitan dos NH4⁺.'),
  entry('nh4hco3', 'amonio', 'dificil', 'NH4HCO3', 'hidrogenocarbonato de amonio', 'hidrogenotrioxocarbonato (IV) de amonio', 'bicarbonato de amonio', 'Es una sal ácida del catión amonio.'),
  entry('nh4clo4', 'amonio', 'dificil', 'NH4ClO4', 'perclorato de amonio', 'tetraoxoclorato (VII) de amonio', 'perclorato amónico', 'Combina NH4⁺ con el anión perclorato.'),
];

export const DEFAULT_SETTINGS = {
  activeTypes: Object.keys(COMPOUND_TYPE_LABELS) as CompoundType[],
  activeNomenclatures: ['stock', 'sistematica', 'tradicional'] as Nomenclature[],
  difficulty: 'media' as Difficulty,
  examMinutes: 35,
  autoCorrection: true,
  autoExplanation: true,
  acceptAccentsOptional: true,
  timerEnabled: true,
};
