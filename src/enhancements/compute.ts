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
  if (!subjectsInfoDiv || subjectsInfoDiv instanceof Error)
    return new Error("No subjects with seminars div");

  const button = document.createElement("button");
  button.className = buttonClass;
  button.innerText = "Load data";
  button.type = "button";

  button.addEventListener("click", async () => {
    const subjectsWithSeminars = getSubjectInfos(subjectsInfoDiv);
    if (subjectsWithSeminars instanceof Error) return subjectsWithSeminars;

    const subjects = await fetchSujects(subjectsWithSeminars);
    if (subjects instanceof Error) return subjects;

    await browser.storage.local.set({ subjects });
    const url = browser.runtime.getURL("page.html");
    window.open(url, "_blank");
  });

  const container = document.createElement("div");
  container.dataset.enhancedIs = "true";
  container.style.display = "contents";
  container.appendChild(button);

  subjectsInfoDiv.before(container);
};

const fetchSujects = async (subjectInfos: SubjectInfo[]) => {
  const promises = subjectInfos.map(async (subject) => {
    const response = await fetch(subject.href);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const result = await response.text();
    const seminars = parseSeminars(result);
    if (seminars instanceof Error) throw seminars;

    return { href: subject.href, title: subject.title, seminars };
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    if (!(error instanceof Error)) return new Error("Unknown error");
    return error;
  }
};

const parseSeminars = (html: string) => {
  const parser = new DOMParser();
  const pageDocumentElement = parser.parseFromString(html, "text/html").documentElement;

  const table = pageDocumentElement.querySelector("table.data1.zakladni_prihlasovani > tbody");
  if (!table) return new Error("No table element");

  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows) return new Error("No rows");

  const seminars: Seminar[] = [];
  for (const row of rows) {
    const seminar = parseSeminar(row);
    if (seminar instanceof Error) return seminar;

    seminars.push(seminar);
  }

  return seminars;
};

export type Seminar = {
  id: string;
  schedule: Schedule;
  teacher: Teacher;
  registerLink: string;
  colisions?: Colision[];
};

const parseSeminar = (element: HTMLTableRowElement) => {
  const seminarDiv = element.querySelector("td > div.seminar");
  if (!seminarDiv) return new Error("No seminar div");

  const id = seminarDiv.querySelector("h5")?.textContent;
  if (!id) return new Error("No id");

  const scheduleString = seminarDiv.childNodes[1]?.textContent;
  if (!scheduleString) return new Error("No schedule");

  const schedule = parseSchedule(scheduleString);
  if (schedule instanceof Error) return schedule;

  const teacher = parseTeacher(seminarDiv);
  if (teacher instanceof Error) return teacher;

  const registerA = element.querySelector('td > font > a.okno[href^="./student"][target="_blank"]');
  if (!(registerA instanceof HTMLAnchorElement)) return new Error("No register a element");

  const registerLink = registerA.href;

  const colisions = parseColisions(element);
  if (colisions instanceof Error) return colisions;

  const seminar: Seminar = {
    id,
    schedule,
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

    const schedule = parseSchedule(name);
    if (schedule instanceof Error) return schedule;

    colisions.push({ name, schedule });
  }
  return colisions;
};

export type Teacher = {
  name: string;
  link: string;
  ratingLink?: string;
};

const parseTeacher = (seminarDiv: Element) => {
  const teacherA = seminarDiv.querySelector("a[href^='/auth/osoba/']");
  if (!(teacherA instanceof HTMLAnchorElement)) return new Error("No teacher a element");

  const name = teacherA.textContent;
  const link = teacherA.href;

  const ratingA = seminarDiv.querySelector("span.nedurazne > a[href^='/auth/pruzkumy/odpovedi']");
  const ratingLink = ratingA instanceof HTMLAnchorElement ? ratingA.href : undefined;

  const teacher: Teacher = { name, link, ratingLink };
  return teacher;
};

export type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};

const parseSchedule = (scheduleString: string) => {
  const regexResults = /^.* (.+) (\d\d?:\d\d)–(\d\d?:\d\d) $/.exec(scheduleString);
  if (!regexResults) return new Error("No regex results");

  const day = regexResults[1];
  const startTime = regexResults[2];
  const endTime = regexResults[3];

  if (!day || !startTime || !endTime) return new Error("No day, startTime or endTime");

  const schedule: Schedule = { day, startTime, endTime };
  return schedule;
};

export type SubjectInfo = {
  href: string;
  title: string;
};
const getSubjectInfos = (subjectsInfoDiv: Element) => {
  const subjectsInfoA = Array.from(subjectsInfoDiv.querySelectorAll('a[href^="./student"]'));

  const subjectsInfo: SubjectInfo[] = [];
  for (const subjects of subjectsInfoA) {
    if (!(subjects instanceof HTMLAnchorElement)) return new Error("Not an anchor element");

    const titleB = subjects.querySelector("b");
    if (!titleB) return new Error("No title b element");

    subjectsInfo.push({
      href: subjects.href,
      title: titleB.textContent,
    });
  }
  return subjectsInfo;
};
