import browser from "webextension-polyfill";
import { buttonClass } from "../components/button";

export type Subject = {
  id: string;
  href: string;
  title: string;
  seminars: Seminar[];
};
export const compute = async () => {
  const subjectsInfoDiv = document.getElementById("ma_sem_skup");
  if (!subjectsInfoDiv) return;

  const button = document.createElement("button");
  button.className = buttonClass;
  button.innerText = "Load data";
  button.type = "button";

  button.addEventListener("click", async () => {
    const subjectInfos = getSubjectInfos(subjectsInfoDiv);
    if (subjectInfos instanceof Error) throw subjectInfos;

    const subjects = await fetchSujects(subjectInfos);
    if (subjects instanceof Error) throw subjects;

    await browser.storage.local.set({ subjects });
    const url = browser.runtime.getURL("index.html");
    window.open(url, "_blank");
  });

  const container = document.createElement("div");
  container.dataset.enhancedIs = "true";
  container.style.display = "contents";
  container.appendChild(button);

  subjectsInfoDiv.before(container);
};

const fetchSujects = async (subjectInfos: SubjectInfo[]) => {
  const promises = subjectInfos.map(async (subjectInfo) => {
    const response = await fetch(subjectInfo.href);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const result = await response.text();
    const seminars = await parseSeminars(result);
    if (seminars instanceof Error) throw seminars;

    const subject: Subject = { ...subjectInfo, seminars };
    return subject;
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    if (!(error instanceof Error)) return new Error("Unknown error");
    return error;
  }
};

const parseSeminars = async (html: string) => {
  const parser = new DOMParser();
  const pageDocumentElement = parser.parseFromString(html, "text/html").documentElement;

  const table = pageDocumentElement.querySelector("table.data1.zakladni_prihlasovani > tbody");
  if (!table) return new Error("No table element");

  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows) return new Error("No rows");

  const promises = rows.map(async (row) => {
    const seminar = await parseSeminar(row);
    if (seminar instanceof Error) throw seminar;

    return seminar;
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    if (!(error instanceof Error)) return new Error("Unknown error");
    return error;
  }
};

export type Seminar = {
  id: string;
  schedules: Schedule[];
  teacher: Teacher;
  registerLink: string;
  colisions?: Colision[];
};

const parseSeminar = async (element: HTMLTableRowElement) => {
  const seminarDiv = element.querySelector("td > div.seminar");
  if (!seminarDiv) return new Error("No seminar div");

  const id = seminarDiv.querySelector("h5")?.textContent;
  if (!id) return new Error("No id");

  const schedules = parseSchedule(seminarDiv);
  if (schedules instanceof Error) return schedules;

  const teacher = await parseTeacher(seminarDiv);
  if (teacher instanceof Error) return teacher;

  const registerA = element.querySelector('td > font > a.okno[href^="./student"][target="_blank"]');
  if (!(registerA instanceof HTMLAnchorElement)) return new Error("No register a element");

  const registerLink = registerA.href;

  const colisions = parseColisions(element);
  if (colisions instanceof Error) return colisions;

  const seminar: Seminar = {
    id,
    schedules,
    teacher,
    registerLink,
    colisions,
  };
  return seminar;
};

export type Colision = {
  name: string;
  schedule: Schedule;
};

const parseColisions = (element: HTMLTableRowElement) => {
  const h6s = Array.from(element.querySelectorAll("td > h6"));
  if (!h6s) return;
  const colisionTitle = h6s.find((h6) => h6.textContent === "Kolize v rozvrhu");
  if (!colisionTitle) return;
  const colisionUl = colisionTitle.nextElementSibling;
  if (!colisionUl) return new Error("No colision ul");

  const colisionLis = Array.from(colisionUl.querySelectorAll("li"));
  const colisions: Colision[] = [];
  for (const colisionLi of colisionLis) {
    const name = colisionLi.childNodes[0]?.textContent;
    if (!name) return new Error("No name");

    const schedule = parseScheduleString(name);
    if (schedule instanceof Error) return schedule;
    if (!schedule) return new Error("No schedule");

    colisions.push({ name, schedule });
  }
  return colisions;
};

export type Teacher = {
  name: string;
  link: string;
  rating?: Rating;
};

type Rating = {
  link: string;
  subjectDifficulty: number;
  averageSubjectDifficulty: number;
  clarity: number;
  averageClarity: number;
  preparedness: number;
  averagePreparedness: number;
  gradingClarity: number;
  averageGradingClarity: number;
  respect?: number;
  averageRespect?: number;
  teachingQuality?: number;
  averageTeachingQuality?: number;
};

const parseTeacher = async (seminarDiv: Element) => {
  const teacherA = seminarDiv.querySelector("a[href^='/auth/osoba/']");
  if (!(teacherA instanceof HTMLAnchorElement)) return new Error("No teacher a element");

  const name = teacherA.textContent;
  const link = teacherA.href;

  const rating = await parseRating(seminarDiv);
  if (rating instanceof Error) return rating;

  const teacher: Teacher = { name, link, rating };
  return teacher;
};

const parseRating = async (seminarDiv: Element) => {
  const ratingA = seminarDiv.querySelector("span.nedurazne > a[href^='/auth/pruzkumy/odpovedi']");
  if (!(ratingA instanceof HTMLAnchorElement)) return;

  const html = await fetchRating(ratingA.href);
  if (html instanceof Error) return html;

  const parser = new DOMParser();
  const pageDocumentElement = parser.parseFromString(html, "text/html").documentElement;

  const tables = Array.from(
    pageDocumentElement.querySelectorAll("table.data1.table_odpovedi > tbody"),
  );
  if (tables.length < 2) return new Error("Not enough tables");

  const difficultyTable = tables[0]!;
  const averageSubjectDifficulty = difficultyTable.querySelector(
    "tr:nth-child(3) > td:nth-child(3)",
  )?.textContent;
  const subjectDifficulty = difficultyTable.querySelector(
    "tr:nth-child(3) > td:nth-child(4)",
  )?.textContent;

  const teacherNodes = Array.from(tables[1]!.childNodes).filter(
    (node) => node instanceof HTMLTableRowElement,
  );

  const clarityResult = parseTableRating(
    teacherNodes,
    "Výklad vyučující(ho) byl vždy srozumitelný a přehledný.",
  );
  if (clarityResult instanceof Error) return clarityResult;

  const preparednessResult = parseTableRating(
    teacherNodes,
    "Vyučující přicházel(a) do výuky vždy dobře připraven(a).",
  );
  if (preparednessResult instanceof Error) return preparednessResult;

  const gradingClarityResult = parseTableRating(
    teacherNodes,
    "Vyučující jasně sdělil(a), jaké znalosti a dovednosti budou hodnoceny.",
  );
  if (gradingClarityResult instanceof Error) return gradingClarityResult;

  const respectResult = parseTableRating(
    teacherNodes,
    "Vyučující se studujícími vždy komunikoval(a) a jednal(a) s respektem.",
  );
  if (respectResult instanceof Error) return respectResult;

  const teachingQualityResult = parseTableRating(
    teacherNodes,
    "Učitel/ka je výborný/á pedagog/pedagožka a velmi dobře učí.",
  );
  if (teachingQualityResult instanceof Error) return teachingQualityResult;

  if (
    !subjectDifficulty ||
    !averageSubjectDifficulty ||
    !clarityResult ||
    !preparednessResult ||
    !gradingClarityResult
  )
    return new Error("Not enough ratings");

  const [clarity, averageClarity] = clarityResult;
  const [preparedness, averagePreparedness] = preparednessResult;
  const [gradingClarity, averageGradingClarity] = gradingClarityResult;
  const [respect, averageRespect] = respectResult ?? [undefined, undefined];
  const [teachingQuality, averageTeachingQuality] = teachingQualityResult ?? [undefined, undefined];

  const rating: Rating = {
    link: ratingA.href,
    subjectDifficulty: Number(subjectDifficulty),
    averageSubjectDifficulty: Number(averageSubjectDifficulty),
    clarity,
    averageClarity,
    preparedness,
    averagePreparedness,
    gradingClarity,
    averageGradingClarity,
    respect,
    averageRespect,
    teachingQuality,
    averageTeachingQuality,
  };
  return rating;
};

const parseTableRating = (nodes: HTMLTableRowElement[], key: string) => {
  const tr = nodes.find((tr) =>
    Array.from(tr.childNodes).some(
      (td) => td instanceof HTMLTableCellElement && td.title.includes(key),
    ),
  );
  if (!tr) return;

  const trChilds = Array.from(tr.childNodes).filter((node) => node instanceof HTMLTableCellElement);
  const rating = trChilds[3]?.textContent;
  const average = trChilds[2]?.textContent;
  if (!rating || !average) return new Error("No average or rating");

  return [Number(rating), Number(average)] as const;
};

const fetchRating = async (link: string) => {
  try {
    const response = await fetch(link);
    if (!response.ok) return new Error(`Response status: ${response.status}`);

    return await response.text();
  } catch (error) {
    if (!(error instanceof Error)) return new Error("Unknown error");
    return error;
  }
};

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export type Schedule = {
  day: WeekDay;
  startTime: string;
  endTime: string;
};

const parseSchedule = (seminarDiv: Element) => {
  const scheduleSet = new Set<string>();
  let schedule: string | undefined = undefined;
  const nodes = Array.from(seminarDiv.childNodes).slice(1);
  for (const node of nodes) {
    const scheduleString = node.textContent;
    if (!scheduleString) return new Error("Text content is empty");

    const scheduleResult = parseScheduleString(scheduleString);
    if (scheduleResult instanceof Error) return scheduleResult;
    if (scheduleResult) {
      schedule = JSON.stringify(scheduleResult);
      continue;
    }

    if (schedule) {
      scheduleSet.add(schedule);
      schedule = undefined;
      continue;
    }

    break;
  }

  return Array.from(scheduleSet.keys()).map((scheduleString) => {
    const schedule: Schedule = JSON.parse(scheduleString);
    return schedule;
  });
};

const ID_MAP: Record<string, WeekDay> = {
  Po: "Mon",
  Út: "Tue",
  St: "Wed",
  Čt: "Thu",
  Pá: "Fri",
};

const parseScheduleString = (scheduleString: string) => {
  const regexResults = /^.* (Po|Út|St|Čt|Pá).* (\d\d?:\d\d)–(\d\d?:\d\d) $/.exec(scheduleString);
  if (!regexResults) return;

  const dayCzech = regexResults[1];
  const startTime = regexResults[2];
  const endTime = regexResults[3];

  if (!dayCzech || !startTime || !endTime) return new Error("No day, startTime or endTime");

  const day = ID_MAP[dayCzech];
  if (!day) return new Error(`Unknown day: ${dayCzech}`);

  return { day, startTime, endTime };
};

export type SubjectInfo = {
  id: string;
  title: string;
  href: string;
};
const getSubjectInfos = (subjectsInfoDiv: Element) => {
  const subjectsInfoA = Array.from(subjectsInfoDiv.querySelectorAll('a[href^="./student"]'));

  const subjectsInfo: SubjectInfo[] = [];
  for (const subjects of subjectsInfoA) {
    if (!(subjects instanceof HTMLAnchorElement)) return new Error("Not an anchor element");

    const titleB = subjects.querySelector("b");
    if (!titleB) return new Error("No title b element");

    const id = titleB.textContent.split(" ")[0];
    if (!id) return new Error("No id");

    subjectsInfo.push({
      id,
      href: subjects.href,
      title: titleB.textContent,
    });
  }
  return subjectsInfo;
};
