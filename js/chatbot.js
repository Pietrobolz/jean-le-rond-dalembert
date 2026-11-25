"use strict";

const chatLog = document.querySelector("#chat-log");
const composer = document.querySelector("#composer");
const questionInput = document.querySelector("#question");
const sendButton = document.querySelector("#send-button");
const resetButton = document.querySelector("#reset-chat");
const typingStatus = document.querySelector("#typing-status");
const chatStatus = document.querySelector("#chat-status");
const localAiToggle = document.querySelector("#local-ai-toggle");
const localAiStatus = document.querySelector("#local-ai-status");
const portraitFrame = document.querySelector("#dialogo .portrait-frame");
const quizForm = document.querySelector("#quiz-form");
const quizResult = document.querySelector("#quiz-result");

const welcomeMessage =
  "Buongiorno. Possiamo discutere di scienza, ragione e sapere. Da quale questione desideri cominciare?";
const responseDelay = 300;
const localModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const localModelModuleUrl = "https://esm.run/@mlc-ai/web-llm";
const localModelPrompt = `Sei una simulazione didattica di Jean le Rond d'Alembert, non la persona storica.
Rispondi in italiano, in modo chiaro e conciso, usando testo semplice. Attieniti al dossier seguente e alle conoscenze storiche documentate; non inventare citazioni, titoli, date o fatti. Se un'informazione non è nel dossier o non è certa, dichiaralo e invita a verificarla nelle fonti indicate. Non attribuire a d'Alembert opinioni sulle tecnologie moderne: puoi solo proporre confronti esplicitamente presentati come attuali.
Dossier verificato: nato a Parigi nel 1717 e morto nel 1783; studiò diritto e medicina prima di dedicarsi alla matematica; entrò all'Académie des sciences nel 1741 e all'Académie française nel 1754. Fu matematico, fisico e filosofo. Collaborò con Denis Diderot all'Encyclopédie e ne scrisse il Discours préliminaire (1751), che presenta e organizza i saperi, anche in dialogo con la classificazione di Francis Bacon. Il Traité de dynamique (1743) espone il principio di d'Alembert in meccanica. L'Essai sur les éléments de philosophie (1759) riflette su scienza, filosofia e conoscenza. Lasciò il progetto dell'Encyclopédie nel 1759 nel contesto di controversie e censura; Diderot continuò a lavorarvi. Il suo contributo riguarda soprattutto la meccanica matematica e l'organizzazione e diffusione del sapere. Democrazie, diritti e istituzioni moderne derivano da processi storici più ampi e non vanno attribuiti a lui solo.
La chat offre come riferimenti Treccani, Larousse, Académie française ed ENCCRE: sono piste per verificare le risposte, non fonti puntuali di ogni singola frase. Chiarisci che questa è una simulazione generata da IA, non una citazione autentica.`;
let lastTopic = null;
let localEngine = null;
let localModelEnabled = false;
let localModelLoading = false;

const sourceLinks = {
  treccani: {
    label: "Treccani",
    href: "https://www.treccani.it/enciclopedia/jean-baptiste-le-rond-detto-d-a-alembert/"
  },
  larousse: {
    label: "Larousse",
    href: "https://www.larousse.fr/encyclopedie/personnage/Jean_Le_Rond_d_Alembert/104702"
  },
  academie: {
    label: "Académie française",
    href: "https://www.academie-francaise.fr/les-immortels/jean-le-rond-dit-dalembert"
  },
  enccre: {
    label: "Edizione digitale ENCCRE",
    href: "https://enccre.academie-sciences.fr/encyclopedie/"
  }
};

const responseLibrary = [
  {
    id: "principle",
    keywords: ["principio di d'alembert", "principio d'alembert", "principio di dalembert", "principio dalembert", "trattato di dinamica", "traite de dynamique", "inerzia"],
    answer: "Nel mio Traité de dynamique (1743) propongo un modo per trattare il moto: si considerano le forze applicate insieme all’effetto dell’inerzia, così il problema dinamico può essere ricondotto a una condizione di equilibrio. È un principio della meccanica, non una spiegazione universale della natura.",
    expansion: "L’idea è trasformare un problema di movimento in un problema di equilibrio introducendo le forze d’inerzia. La formulazione matematica permette di studiare sistemi vincolati con un metodo comune. Il principio va applicato entro le ipotesi della meccanica: non sostituisce l’osservazione né descrive ogni fenomeno.",
    example: "Immagina un carrello tirato da una forza: per analizzarne il moto si considerano la forza che lo tira e l’effetto legato alla sua accelerazione. Il modello aiuta a calcolare il movimento; non racconta ogni dettaglio reale, come attriti o irregolarità, se non li include.",
    followUps: ["Perché è utile in meccanica?", "Quali altre opere ho scritto?", "Come si collega al metodo scientifico?"],
    source: sourceLinks.treccani
  },
  {
    id: "encyclopedia",
    keywords: ["encyclopedie", "encyclopedia", "enciclopedia", "diderot", "enciclopedismo"],
    answer: "Con Denis Diderot curai l’Encyclopédie: un’opera che raccoglieva saperi e arti e li metteva in relazione. Non era un semplice elenco: offriva ai lettori strumenti per consultare conoscenze diverse e vedere come potevano collegarsi.",
    expansion: "Il progetto univa voci, spiegazioni e tavole sulle arti e sui mestieri. La conoscenza veniva presentata come un insieme organizzabile e consultabile. La pubblicazione, però, incontrò opposizioni e provvedimenti di censura: diffondere il sapere era anche una questione culturale e politica.",
    example: "Pensa a una voce sull’astronomia: una buona enciclopedia può spiegarne i concetti, rimandare alla matematica che usa e mostrare gli strumenti di osservazione. Il lettore non riceve solo un fatto, ma un percorso fra saperi.",
    followUps: ["Che cosa scrissi nel Discours préliminaire?", "Che rapporto avevo con Diderot?", "Perché l’opera fu censurata?"],
    source: sourceLinks.enccre
  },
  {
    id: "discourse",
    keywords: ["discours preliminaire", "discorso preliminare", "albero delle conoscenze", "1751"],
    answer: "Il Discours préliminaire (1751) è l’introduzione all’Encyclopédie. Ricostruisce la storia delle idee e presenta una mappa delle conoscenze, ispirata anche alla classificazione di Francis Bacon. Il suo scopo è rendere leggibile il progetto dell’opera.",
    expansion: "Nella mappa del Discours, i campi del sapere sono messi in rapporto con facoltà umane e percorsi storici. È una proposta culturale del Settecento, non una classificazione definitiva: aiuta a orientarsi, ma i confini tra le discipline possono cambiare.",
    example: "Per studiare il clima, puoi collegare osservazioni storiche, strumenti scientifici e spiegazioni fisiche. Una mappa del sapere aiuta a capire quali discipline contribuiscono alla stessa domanda.",
    followUps: ["Come funzionava la classificazione?", "Che cos’è l’Encyclopédie?", "Questa mappa è ancora valida?"],
    source: sourceLinks.treccani
  },
  {
    id: "works",
    keywords: ["opere", "libri", "saggi", "elements de philosophie", "elementi di filosofia"],
    answer: "Tre opere aiutano a seguire il mio lavoro: il Traité de dynamique (1743), sulla meccanica; il Discours préliminaire (1751), introduzione all’Encyclopédie; e l’Essai sur les éléments de philosophie (1759), che affronta questioni filosofiche e i limiti della conoscenza.",
    expansion: "Le opere mostrano tre aspetti diversi: applicare la matematica alla natura, organizzare i saperi e chiedersi che cosa possiamo conoscere. Per studiarle, conviene collegare ogni testo al suo contesto e non ridurlo a una singola frase.",
    example: "Se devi preparare una scheda, confronta anno e genere: trattato scientifico per il Traité, discorso introduttivo per il Discours, saggio filosofico per l’Essai. Poi spiega per ciascuno un’idea e la sua importanza.",
    followUps: ["Approfondiamo il Traité de dynamique", "Parlami del Discours préliminaire", "Che cosa sostiene l’Essai?"],
    source: sourceLinks.treccani
  },
  {
    id: "science",
    keywords: ["scienza", "matematica", "fisica", "meccanica", "metodo scientifico"],
    answer: "Per studiare la natura, osserviamo i fenomeni, formuliamo spiegazioni e confrontiamo le conseguenze con i fatti. La matematica rende più precisi alcuni modelli; non elimina la necessità di verificare le ipotesi e dichiararne i limiti.",
    expansion: "La mia attività di matematico e fisico si concentrò anche sulla meccanica, sui fluidi e sulle corde vibranti. Una teoria scientifica non è una semplice opinione: deve avere una struttura ragionata e confrontarsi con i problemi che dichiara di trattare.",
    example: "Un modello del moto può prevedere dove si troverà un oggetto dopo un certo tempo. Prima di fidarti del risultato, controlla quali forze sono state considerate e quali condizioni sono state semplificate.",
    followUps: ["Fammi un esempio di modello", "Che cos’è il principio d’Alembert?", "Come distinguere scienza e opinione?"],
    source: sourceLinks.larousse
  },
  {
    id: "reason",
    keywords: ["ragione", "pensiero", "critica", "idee ricevute", "illuminismo", "lumi"],
    answer: "La ragione serve a esaminare le idee, chiedere prove e correggere un giudizio quando le ragioni non lo sostengono. Non significa sapere tutto né rifiutare ogni tradizione: significa non considerare vera un’affermazione solo perché è ripetuta o autorevole.",
    expansion: "Il progetto illuminista valorizza la discussione e l’indagine, ma non coincide con un’unica dottrina condivisa da tutti. Nel mio lavoro, organizzare le conoscenze e rendere espliciti i ragionamenti era un modo per aiutare il lettore a orientarsi.",
    example: "Se una notizia viene condivisa da molte persone, la sua popolarità non è una prova. Cerca l’origine, confronta fonti indipendenti e separa ciò che è osservato dall’interpretazione.",
    followUps: ["Come si applica ai social?", "Quali sono i limiti della ragione?", "Che cosa distingue l’Illuminismo?"],
    source: sourceLinks.treccani
  },
  {
    id: "knowledge-limits",
    keywords: ["limiti della conoscenza", "limiti del sapere", "locke", "esperienza", "empirismo", "conoscere"],
    answer: "La ragione è preziosa, ma non garantisce di conoscere l’essenza ultima di ogni cosa. Nei miei scritti filosofici rifletto sulle fonti del conoscere e sui suoi limiti, in dialogo con l’empirismo di Locke.",
    expansion: "Riconoscere un limite non vuol dire rinunciare alla ricerca. Vuol dire distinguere ciò che è sostenuto da argomenti ed esperienza da ciò che resta ipotesi o questione aperta, e non trasformare l’incertezza in una certezza apparente.",
    example: "Se uno studio non ha dati sufficienti per stabilire se un effetto esista, la risposta onesta è che le prove non bastano ancora. Nuove osservazioni potrebbero cambiare il quadro.",
    followUps: ["Che rapporto c’è tra ragione ed esperienza?", "Fammi un esempio attuale", "Quale opera tratta questi temi?"],
    source: sourceLinks.treccani
  },
  {
    id: "censorship",
    keywords: ["censura", "divieto", "vietata", "controversia", "geneve", "ginevra"],
    answer: "La pubblicazione dell’Encyclopédie incontrò opposizioni e restrizioni. Dopo la controversia nata dall’articolo «Genève» e nel clima di repressione editoriale, nel 1759 lasciai il progetto. La storia dell’opera mostra che far circolare le idee dipendeva anche dalle istituzioni.",
    expansion: "La censura dell’Ancien Régime non fu un semplice dissenso fra studiosi: autorità politiche e religiose potevano intervenire sui privilegi di stampa e sulla circolazione dei libri. Diderot continuò a lavorare all’opera anche dopo il mio allontanamento.",
    example: "Quando un contenuto viene rimosso, chiediti chi ha preso la decisione, in base a quali regole e se è possibile consultare fonti indipendenti. Il contesto e il potere che controlla la diffusione sono parte dell’analisi.",
    followUps: ["Che cosa accadde con Rousseau?", "Come funzionava la stampa nel Settecento?", "Che cosa c’entra con la libertà di informazione?"],
    source: sourceLinks.larousse
  },
  {
    id: "relationships",
    keywords: ["diderot", "voltaire", "rousseau", "philosophes", "illuministi", "amici"],
    answer: "Diderot fu il mio collaboratore nella direzione dell’Encyclopédie. Fui amico di Voltaire e partecipai ai dibattiti dei philosophes; la mia voce «Genève» provocò una controversia con Rousseau, che rispose con una lettera sui teatri.",
    expansion: "Gli illuministi non erano un gruppo con idee identiche. Collaboravano, discutevano e talvolta entravano in conflitto. Le polemiche sull’Encyclopédie e sui teatri mostrano che il dibattito riguardava anche la cultura pubblica e le istituzioni.",
    example: "In un lavoro di gruppo, due autori possono condividere l’obiettivo di diffondere il sapere ma dissentire su quali contenuti siano utili. Non appiattire il dissenso: spiegare le differenze rende il quadro storico più preciso.",
    followUps: ["Perché Rousseau criticò l’articolo Genève?", "Che ruolo ebbe Diderot?", "Che cosa univa i philosophes?"],
    source: sourceLinks.academie
  },
  {
    id: "legacy",
    keywords: ["influenza", "eredità", "civilta occidentale", "democrazia", "diritti", "societa moderna"],
    answer: "Il mio contributo si vede soprattutto nella cultura scientifica e nell’organizzazione del sapere: meccanica matematica e progetto enciclopedico. Diritti, democrazie e istruzione moderna sono sviluppi complessi, a cui contribuirono molti autori e vicende successive; non vanno attribuiti a una sola persona.",
    expansion: "È corretto distinguere tra ciò che scrissi e il modo in cui le generazioni successive ripresero o trasformarono idee illuministe. Il progetto enciclopedico contribuì a una cultura della consultazione e della divulgazione, ma le istituzioni moderne nacquero attraverso processi storici più ampi.",
    example: "Quando colleghi un filosofo a un diritto contemporaneo, indica il passaggio: quale idea formulò, chi la riprese e quali eventi la trasformarono? Se non puoi documentare il legame, presentalo come confronto, non come causa diretta.",
    followUps: ["Qual è il legame con la scuola di oggi?", "In che modo è cambiata la diffusione del sapere?", "Quali idee sono davvero mie?"],
    source: sourceLinks.treccani
  },
  {
    id: "civic-tech",
    keywords: ["notizia", "disinformazione", "fake news", "social", "intelligenza artificiale", "chatbot", "verificare", "ia", "algoritmo"],
    answer: "Non potevo conoscere social network o intelligenza artificiale. Possiamo però applicare oggi un atteggiamento critico: chiedere quali prove sostengono una risposta, controllare le fonti e distinguere una sintesi da una citazione autentica.",
    expansion: "Un sistema digitale può rendere molte informazioni accessibili, ma accessibilità e affidabilità non sono la stessa cosa. Confronta la risposta con fonti attendibili, cerca il documento originale quando possibile e dichiara quando hai usato un’IA.",
    example: "Se un chatbot attribuisce a d’Alembert una frase, non basta che suoni plausibile: cerca la frase nell’opera o in un’edizione affidabile. Se non trovi una fonte verificabile, non presentarla come citazione.",
    followUps: ["Come riconoscere una fonte affidabile?", "Come funziona il quiz?", "Che differenza c’è tra sintesi e citazione?"],
    source: sourceLinks.enccre
  },
  {
    id: "biography",
    keywords: ["chi sei", "chi era", "biografia", "nascita", "vita", "jean le rond", "d'alembert", "dalembert"],
    answer: "Sono Jean le Rond d’Alembert, matematico e filosofo francese, nato a Parigi nel 1717. Studiai anche diritto e medicina prima di dedicarmi alla matematica; sono ricordato per il lavoro scientifico e la collaborazione con Diderot all’Encyclopédie.",
    expansion: "La mia vita si svolse tra Parigi, le accademie e i salotti. Entrai all’Académie des sciences nel 1741 e all’Académie française nel 1754; più tardi ne divenni segretario perpetuo. Le fonti biografiche documentano anche la mia amicizia con Voltaire.",
    example: "Per presentarmi in una scheda non basta dire «illuminista»: aggiungi date e luoghi, formazione, opere e istituzioni. Poi collega questi fatti al contesto della monarchia e della censura editoriale.",
    followUps: ["Perché mi chiamarono d’Alembert?", "Quali furono le mie opere?", "Che rapporti avevo con Voltaire?"],
    source: sourceLinks.academie
  }
];

const quizAnswers = {
  q1: {
    answer: "a",
    explanation: "L’Encyclopédie raccoglieva e organizzava saperi e arti del tempo, con l’obiettivo di renderli consultabili."
  },
  q2: {
    answer: "b",
    explanation: "Il Traité de dynamique (1743) espone il principio di d’Alembert applicato alla meccanica."
  },
  q3: {
    answer: "b",
    explanation: "Il Discours préliminaire fu pubblicato come introduzione all’Encyclopédie nel 1751."
  },
  q4: {
    answer: "b",
    explanation: "La consegna chiede di distinguere i contributi di d’Alembert dagli sviluppi politici successivi, frutto di molti autori e contesti."
  },
  q5: {
    answer: "b",
    explanation: "Le risposte dell’IA vanno verificate con fonti attendibili; l’uso dell’IA deve essere dichiarato."
  }
};

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createMessage(text, speaker, type, source = null) {
  const row = document.createElement("article");
  row.className = `message-row ${type}-message`;

  if (type === "assistant") {
    const avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = "assets/dalembert.svg";
    avatar.alt = "";
    avatar.setAttribute("aria-hidden", "true");
    row.append(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const author = document.createElement("p");
  author.className = "message-author";
  author.textContent = speaker;

  const message = document.createElement("p");
  message.className = "message-text";
  message.textContent = text;

  bubble.append(author, message);

  if (source) bubble.append(createSourceLink(source));
  row.append(bubble);
  return row;
}

function createSourceLink(source) {
  const link = document.createElement("a");
  link.className = "message-source";
  link.href = source.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `Fonte: ${source.label}`;
  return link;
}

function addMessage(text, speaker, type, source = null) {
  chatLog.append(createMessage(text, speaker, type, source));
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addInlineSuggestions(messageRow, suggestions) {
  const nav = document.createElement("nav");
  nav.className = "message-followups";
  nav.setAttribute("aria-label", "Domande di approfondimento");

  const label = document.createElement("span");
  label.textContent = "Puoi approfondire";
  nav.append(label);

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.className = "suggestion";
    button.type = "button";
    button.textContent = suggestion;
    nav.append(button);
  });

  messageRow.append(nav);
}

function getFollowUpResponse(question) {
  if (!lastTopic) return null;

  const normalized = normalizeText(question);
  if (/^(e poi|perche|come mai|spiega|approfondisci|puoi chiarire|fammi un esempio|un esempio|e oggi|continua|dimmi di piu)/.test(normalized)) {
    const text = normalized.includes("esempio")
      ? lastTopic.example
      : lastTopic.expansion;
    return { ...lastTopic, answer: text };
  }

  return null;
}

function findResponse(question) {
  const followUp = getFollowUpResponse(question);
  if (followUp) return followUp;

  const normalizedQuestion = normalizeText(question);
  const matches = responseLibrary
    .map((topic) => ({
      topic,
      score: topic.keywords.reduce((bestScore, keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return normalizedQuestion.includes(normalizedKeyword)
          ? Math.max(bestScore, normalizedKeyword.length)
          : bestScore;
      }, 0)
    }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score);

  if (matches.length > 0) return matches[0].topic;

  return {
    id: "clarification",
    answer: "Non trovo una risposta verificata a questa domanda nella mia piccola biblioteca. Posso però aiutarti a riformularla: riguarda la mia vita, l’Encyclopédie, il metodo scientifico, la meccanica o un collegamento con il presente?",
    expansion: "Per rispondere in modo affidabile occorre delimitare la domanda e trovare una fonte. Se riguarda un fatto storico, confronta una biografia autorevole o un’edizione dell’opera; non inventerò una citazione per riempire il vuoto.",
    example: "Per esempio, invece di chiedere «cosa pensava?», prova con «che cosa sostiene il Discours préliminaire sulla classificazione dei saperi?»",
    followUps: ["Che cos’è l’Encyclopédie?", "Quali sono le opere principali?", "Come verificare una citazione?"],
    source: sourceLinks.enccre
  };
}

function setLocalAiStatus(message, isError = false) {
  localAiStatus.textContent = message;
  localAiStatus.classList.toggle("is-error", isError);
}

function updateLocalAiControls() {
  localAiToggle.setAttribute("aria-pressed", String(localModelEnabled));
  localAiToggle.textContent = localModelLoading
    ? "Caricamento IA…"
    : localModelEnabled
      ? "Disattiva IA locale"
      : localEngine
        ? "Riattiva IA locale"
        : "Avvia IA locale";
  localAiToggle.disabled = localModelLoading || sendButton.disabled;
}

function getVisibleConversation() {
  return [...chatLog.querySelectorAll(".message-row")]
    .map((row) => {
      const text = row.querySelector(".message-text")?.textContent.trim();
      if (!text) return null;
      return {
        role: row.classList.contains("user-message") ? "user" : "assistant",
        content: text
      };
    })
    .filter(Boolean)
    .slice(-8);
}

function addLocalReferenceLinks(messageRow) {
  const references = document.createElement("p");
  references.className = "message-source-list";
  references.append("Riferimenti da verificare: ");

  [sourceLinks.treccani, sourceLinks.enccre, sourceLinks.academie].forEach((source, index) => {
    if (index > 0) references.append(" · ");
    const link = createSourceLink(source);
    link.textContent = source.label;
    references.append(link);
  });

  messageRow.querySelector(".message-bubble").append(references);
}

async function respondWithLocalModel(question) {
  const row = createMessage("", "D’Alembert · IA locale (simulazione)", "assistant");
  const answerElement = row.querySelector(".message-text");
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const messages = [
      { role: "system", content: localModelPrompt },
      ...getVisibleConversation()
    ];
    const stream = await localEngine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 240
    });

    let answer = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (typeof text === "string" && text) {
        answer += text;
        answerElement.textContent = answer;
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    }

    answer = answer.trim();
    if (!answer) throw new Error("Il modello non ha prodotto una risposta.");

    answerElement.textContent = answer;
    addLocalReferenceLinks(row);
    addInlineSuggestions(row, [
      "Puoi fare un esempio concreto?",
      "Quale opera si collega a questo tema?",
      "Come si collega al presente?"
    ]);
    lastTopic = findResponse(question);
    setLocalAiStatus("IA locale attiva. Le risposte sono generate sul dispositivo e vanno verificate.");
    chatLog.scrollTop = chatLog.scrollHeight;
    return answer;
  } catch (error) {
    console.error("La generazione con il modello locale non è riuscita:", error);
    row.remove();

    const response = findResponse(question);
    lastTopic = response;
    const fallbackRow = createMessage(
      response.answer,
      "D’Alembert · risposta verificata",
      "assistant",
      response.source
    );
    chatLog.append(fallbackRow);
    addInlineSuggestions(fallbackRow, response.followUps);
    setLocalAiStatus("Generazione locale non riuscita: è mostrata una risposta predefinita verificata.", true);
    chatLog.scrollTop = chatLog.scrollHeight;
    return response.answer;
  }
}

async function toggleLocalAi() {
  if (localModelLoading || sendButton.disabled) return;

  if (localEngine) {
    localModelEnabled = !localModelEnabled;
    updateLocalAiControls();
    setLocalAiStatus(localModelEnabled
      ? "IA locale attiva. Le risposte sono generate sul dispositivo e vanno verificate."
      : "IA locale disattivata; restano disponibili le risposte predefinite.");
    chatStatus.textContent = localModelEnabled ? "IA locale attiva" : "Risposte verificate";
    return;
  }

  if (!navigator.gpu) {
    setLocalAiStatus("Questo browser o dispositivo non supporta WebGPU. Puoi continuare con le risposte predefinite.", true);
    return;
  }

  localModelLoading = true;
  updateLocalAiControls();
  setLocalAiStatus("Avvio del modello locale. Il primo caricamento può richiedere tempo e scaricare centinaia di MB.");

  try {
    const { CreateMLCEngine } = await import(localModelModuleUrl);
    localEngine = await CreateMLCEngine(localModelId, {
      initProgressCallback: (report) => {
        const percentage = Number.isFinite(report.progress)
          ? `${Math.round(report.progress * 100)}% · `
          : "";
        setLocalAiStatus(`${percentage}${report.text || "Caricamento del modello locale…"}`);
      }
    });
    localModelEnabled = true;
    setLocalAiStatus("Modello pronto. Le risposte sono generate sul dispositivo e vanno verificate.");
    chatStatus.textContent = "IA locale attiva";
  } catch (error) {
    console.error("Impossibile inizializzare il modello IA locale:", error);
    localModelEnabled = false;
    chatStatus.textContent = "Risposte verificate";
    setLocalAiStatus("Modello non disponibile. Verifica WebGPU, connessione o memoria; le risposte predefinite restano attive.", true);
  } finally {
    localModelLoading = false;
    updateLocalAiControls();
  }
}

function setBusy(isBusy) {
  questionInput.disabled = isBusy;
  sendButton.disabled = isBusy;
  resetButton.disabled = isBusy;
  updateLocalAiControls();
  chatLog.querySelectorAll(".suggestion").forEach((button) => {
    button.disabled = isBusy;
  });
  typingStatus.textContent = isBusy ? "D’Alembert sta preparando la risposta…" : "";
  chatStatus.textContent = isBusy
    ? "D’Alembert sta riflettendo…"
    : localModelEnabled
      ? "IA locale attiva"
      : "A te la parola";
  portraitFrame.classList.toggle("is-thinking", isBusy);
  portraitFrame.classList.remove("is-speaking");
}

function showTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row assistant-message";
  row.id = "typing-indicator";
  row.setAttribute("aria-label", "D’Alembert sta scrivendo");

  const avatar = document.createElement("img");
  avatar.className = "message-avatar";
  avatar.src = "assets/dalembert.svg";
  avatar.alt = "";
  avatar.setAttribute("aria-hidden", "true");

  const dots = document.createElement("div");
  dots.className = "message-bubble typing-indicator";
  dots.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 3; index += 1) {
    dots.append(document.createElement("span"));
  }

  row.append(avatar, dots);
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function removeTypingIndicator() {
  chatLog.querySelector("#typing-indicator")?.remove();
}

async function submitQuestion(question) {
  const cleanedQuestion = question.trim();
  if (!cleanedQuestion || sendButton.disabled) return;

  chatLog.querySelectorAll(".message-followups").forEach((suggestions) => suggestions.remove());
  addMessage(cleanedQuestion, "Tu chiedi", "user");
  questionInput.value = "";
  setBusy(true);
  showTypingIndicator();

  await new Promise((resolve) => window.setTimeout(resolve, responseDelay));
  removeTypingIndicator();

  portraitFrame.classList.remove("is-thinking");
  portraitFrame.classList.add("is-speaking");
  let answer;
  if (localModelEnabled && localEngine) {
    chatStatus.textContent = "IA locale · generazione in corso";
    typingStatus.textContent = "Risposta generata sul dispositivo: verifica sempre i riferimenti";
    answer = await respondWithLocalModel(cleanedQuestion);
  } else {
    const response = findResponse(cleanedQuestion);
    lastTopic = response;
    chatStatus.textContent = "D’Alembert sta parlando…";
    typingStatus.textContent = "Risposta simulata basata sulle fonti indicate";

    const row = createMessage(response.answer, "D’Alembert · simulazione", "assistant", response.source);
    chatLog.append(row);
    addInlineSuggestions(row, response.followUps);
    chatLog.scrollTop = chatLog.scrollHeight;
    answer = response.answer;
  }

  const speakingDuration = Math.min(2600, Math.max(950, answer.split(/\s+/).length * 22));
  await new Promise((resolve) => window.setTimeout(resolve, speakingDuration));
  setBusy(false);
  questionInput.focus();
}

function resetConversation() {
  if (sendButton.disabled) return;

  chatLog.replaceChildren();
  lastTopic = null;
  addMessage(welcomeMessage, "D’Alembert · simulazione", "assistant");
  addInlineSuggestions(chatLog.lastElementChild, [
    "A cosa serve l’Encyclopédie?",
    "Spiegami il principio di d’Alembert",
    "Come verificare una notizia?"
  ]);

  chatStatus.textContent = "Pronto a rispondere";
  questionInput.value = "";
  typingStatus.textContent = "";
  questionInput.focus();
}

function gradeQuiz() {
  const answers = new FormData(quizForm);
  let score = 0;

  Object.entries(quizAnswers).forEach(([questionName, result]) => {
    const question = quizForm.querySelector(`[data-question="${questionName}"]`);
    const feedback = question.querySelector(".quiz-feedback");
    const selectedAnswer = answers.get(questionName);
    const isCorrect = selectedAnswer === result.answer;

    if (isCorrect) score += 1;
    feedback.className = `quiz-feedback ${isCorrect ? "correct" : "incorrect"}`;
    feedback.textContent = `${isCorrect ? "Corretto. " : "Non proprio. "}${result.explanation}`;
  });

  const outcome = score === 5
    ? "Ottimo: hai completato il percorso con tutte le risposte corrette."
    : score >= 3
      ? "Buon lavoro. Rileggi le spiegazioni delle risposte da rivedere."
      : "Ripassa le sezioni e prova di nuovo: le spiegazioni ti aiutano a consolidare le idee.";

  quizResult.textContent = `Punteggio: ${score}/5. ${outcome}`;
}

function clearQuizFeedback() {
  quizForm.querySelectorAll(".quiz-feedback").forEach((feedback) => {
    feedback.className = "quiz-feedback";
    feedback.textContent = "";
  });
  quizResult.textContent = "";
}

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(questionInput.value);
});

chatLog.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const suggestion = target.closest(".suggestion");
  if (suggestion && !suggestion.disabled) submitQuestion(suggestion.textContent);
});

resetButton.addEventListener("click", resetConversation);
localAiToggle.addEventListener("click", toggleLocalAi);

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeQuiz();
});

quizForm.addEventListener("reset", () => {
  window.setTimeout(clearQuizFeedback, 0);
});
