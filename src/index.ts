import browser from "webextension-polyfill";
import type { Schedule, Seminar, Subject, WeekDay } from "./enhancements/compute";

const addedSubjects = {
  get: async (subject: Subject) => {
    const result = await browser.storage.local.get("addedSubjects");
    if (!("addedSubjects" in result)) return;

    /* @ts-expect-error */
    const addedSubjects: [Subject, Seminar][] = result.addedSubjects;
    const getResult = addedSubjects.find(([addedSubject]) => addedSubject.id === subject.id);
    if (getResult) {
      return getResult[1];
    }
  },
  set: async (subject: Subject, seminar: Seminar) => {
    const result = await browser.storage.local.get("addedSubjects");
    if (!("addedSubjects" in result)) {
      await browser.storage.local.set({ addedSubjects: [[subject, seminar]] });
      return;
    }

    /* @ts-expect-error */
    const unfilteredAddedSubjects: [Subject, Seminar][] = result.addedSubjects;
    const addedSubjects = unfilteredAddedSubjects.filter(
      ([addedSubject]) => addedSubject.id !== subject.id,
    );
    addedSubjects.push([subject, seminar]);

    await browser.storage.local.set({ addedSubjects });
  },
  delete: async (subject: Subject) => {
    const result = await browser.storage.local.get("addedSubjects");
    if (!("addedSubjects" in result)) {
      return false;
    }

    /* @ts-expect-error */
    const addedSubjects: [Subject, Seminar][] = result.addedSubjects;
    const index = addedSubjects.findIndex(([addedSubject]) => addedSubject.id === subject.id);
    if (index === -1) {
      return false;
    }
    addedSubjects.splice(index, 1);
    await browser.storage.local.set({ addedSubjects });

    return true;
  },
  entries: async () => {
    const result = await browser.storage.local.get("addedSubjects");
    if (!("addedSubjects" in result)) {
      return [];
    }

    /* @ts-expect-error */
    const addedSubjects: [Subject, Seminar][] = result.addedSubjects;
    return addedSubjects;
  },
};

const handleSelect = async (event: PointerEvent, seminar: Seminar, subject: Subject) => {
  const currentTarget = event.currentTarget;
  if (!(currentTarget instanceof HTMLButtonElement))
    throw new Error("currentTarget is not a HTMLButtonElement");

  const addedSeminar = await addedSubjects.get(subject);

  if (!addedSeminar) {
    addSubject(subject, seminar);
    currentTarget.dataset.selected = "true";
    return;
  }

  await removeSubject(subject);

  if (seminar.id === addedSeminar.id) {
    currentTarget.dataset.selected = "false";
    return;
  }

  const previousSelectedSeminar = document.getElementById(addedSeminar.id)!;
  previousSelectedSeminar.dataset.selected = "false";
  await addSubject(subject, seminar);
  currentTarget.dataset.selected = "true";
};

const addSubject = async (subject: Subject, seminar: Seminar) => {
  addSubjectToCalendar(subject, seminar);
  await addedSubjects.set(subject, seminar);
};

const addSubjectToCalendar = (subject: Subject, seminar: Seminar) => {
  for (const [index, schedule] of seminar.schedules.entries()) {
    const seminarContainerDiv = document.createElement("div");
    seminarContainerDiv.classList = "absolute w-full p-0.5";
    seminarContainerDiv.id = `${subject.id}-${index}`;

    const { offset, duration } = calculateSchedulePosition(schedule);

    seminarContainerDiv.style.top = `${offset}px`;
    seminarContainerDiv.style.height = `${duration}px`;

    const seminarDiv = document.createElement("div");
    seminarDiv.classList = "h-full rounded border bg-gray-900 p-0.5";

    const seminarTitleP = document.createElement("p");
    seminarTitleP.textContent = subject.title;
    seminarDiv.appendChild(seminarTitleP);

    const seminarScheduleP = document.createElement("p");
    seminarScheduleP.textContent = `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`;
    seminarDiv.appendChild(seminarScheduleP);

    const seminarTeacherP = document.createElement("p");
    seminarTeacherP.textContent = seminar.teacher.name;
    seminarDiv.appendChild(seminarTeacherP);

    seminarContainerDiv.appendChild(seminarDiv);

    document.getElementById(schedule.day)!.appendChild(seminarContainerDiv);
  }
};

const removeSubject = async (subject: Subject) => {
  const calendarDivs = Array.from(document.querySelectorAll(`div[id^="${subject.id}-"]`));
  if (!calendarDivs.length) throw new Error("Calendar divs not found");

  for (const calendarDiv of calendarDivs) {
    calendarDiv.remove();
  }

  await addedSubjects.delete(subject);
};

const calculateSchedulePosition = (schedule: Schedule) => {
  const [startHourString, startMinuteString] = schedule.startTime.split(":");
  const [endHourString, endMinuteString] = schedule.endTime.split(":");

  if (!startHourString || !startMinuteString || !endHourString || !endMinuteString)
    throw new Error("Invalid schedule");

  const startHour = Number(startHourString);
  const startMinute = Number(startMinuteString);
  const endHour = Number(endHourString);
  const endMinute = Number(endMinuteString);

  const offset = startHour * 60 + startMinute;
  const duration = endHour * 60 + endMinute - offset;

  return {
    offset,
    duration,
  };
};

type ComputedRating = {
  averageClarity?: number;
  averageSubjectDifficulty?: number;
};

const computeRatings = (subject: Subject) => {
  const totalData = subject.seminars.reduce(
    (total, seminar) => {
      if (!seminar.teacher.rating) {
        return total;
      }

      return {
        claritySum: total.claritySum + seminar.teacher.rating.clarity,
        clarityCount: total.clarityCount + 1,
        subjectDifficulty: total.subjectDifficulty + seminar.teacher.rating.subjectDifficulty,
        subjectDifficultyCount: total.subjectDifficultyCount + 1,
      };
    },
    {
      claritySum: 0,
      clarityCount: 0,
      subjectDifficulty: 0,
      subjectDifficultyCount: 0,
    },
  );

  const averageClarity =
    totalData.clarityCount !== 0
      ? Math.round((totalData.claritySum / totalData.clarityCount) * 100) / 100
      : undefined;
  const averageSubjectDifficulty =
    totalData.subjectDifficultyCount !== 0
      ? Math.round((totalData.subjectDifficulty / totalData.subjectDifficultyCount) * 100) / 100
      : undefined;

  const computedRating: ComputedRating = {
    averageClarity,
    averageSubjectDifficulty,
  };
  return computedRating;
};

const addedCustoms = {
  add: async (custom: Custom) => {
    const result = await browser.storage.local.get("addedCustoms");
    if (!("addedCustoms" in result)) {
      await browser.storage.local.set({ addedCustoms: [custom] });
      return;
    }

    /* @ts-expect-error */
    const unfilteredAddedCustoms: Custom[] = result.addedCustoms;
    const addedCustoms = unfilteredAddedCustoms.filter(
      (addedCustom) => addedCustom.id !== custom.id,
    );
    addedCustoms.push(custom);

    await browser.storage.local.set({ addedCustoms });
  },
  delete: async (custom: Custom) => {
    const result = await browser.storage.local.get("addedCustoms");
    if (!("addedCustoms" in result)) {
      return false;
    }

    /* @ts-expect-error */
    const addedCustoms: Custom[] = result.addedCustoms;
    const index = addedCustoms.findIndex((addedCustom) => addedCustom.id === custom.id);
    if (index === -1) {
      return false;
    }
    addedCustoms.splice(index, 1);
    await browser.storage.local.set({ addedCustoms });

    return true;
  },
  entries: async () => {
    const result = await browser.storage.local.get("addedCustoms");
    if (!("addedCustoms" in result)) {
      return [];
    }

    /* @ts-expect-error */
    const addedCustoms: Custom[] = result.addedCustoms;
    return addedCustoms;
  },
};

type Custom = {
  id: string;
  title: string;
  schedule: Schedule;
};
const addCustom = async (custom: Custom) => {
  addCleanCustom(custom);
  await addedCustoms.add(custom);
};

const addCleanCustom = (custom: Custom) => {
  const customCalendarContainerDiv = document.createElement("div");
  customCalendarContainerDiv.classList = "absolute w-full p-0.5";
  customCalendarContainerDiv.id = custom.id;

  const { offset, duration } = calculateSchedulePosition(custom.schedule);
  customCalendarContainerDiv.style.top = `${offset}px`;
  customCalendarContainerDiv.style.height = `${duration}px`;

  const customCalendarDiv = document.createElement("div");
  customCalendarDiv.classList = "h-full rounded border bg-gray-900 p-0.5";

  const customTitleP = document.createElement("p");
  customTitleP.textContent = custom.title;
  customCalendarDiv.appendChild(customTitleP);

  const customScheduleP = document.createElement("p");
  customScheduleP.textContent = `${custom.schedule.day} ${custom.schedule.startTime} - ${custom.schedule.endTime}`;
  customCalendarDiv.appendChild(customScheduleP);

  customCalendarContainerDiv.appendChild(customCalendarDiv);

  document.getElementById(custom.schedule.day)!.appendChild(customCalendarContainerDiv);

  const customContainerDiv = document.createElement("div");
  customContainerDiv.classList = "flex items-center justify-between rounded border p-2";

  const dataDiv = document.createElement("div");
  dataDiv.classList = "flex flex-col";

  const titleP = document.createElement("p");
  titleP.textContent = custom.title;
  dataDiv.appendChild(titleP);

  const scheduleP = document.createElement("p");
  scheduleP.textContent = `${custom.schedule.day} ${custom.schedule.startTime} - ${custom.schedule.endTime}`;
  dataDiv.appendChild(scheduleP);

  customContainerDiv.appendChild(dataDiv);

  const removeButton = document.createElement("button");
  removeButton.classList = "rounded border px-2 py-1";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", async () => {
    await addedCustoms.delete(custom);
    customCalendarContainerDiv.remove();
    customContainerDiv.remove();
  });
  customContainerDiv.appendChild(removeButton);

  document.getElementById("customs")!.appendChild(customContainerDiv);
};

(async () => {
  const data = await browser.storage.local.get("subjects");
  /* @ts-expect-error */
  const subjects: Subject[] = data.subjects;
  for (const subject of subjects) {
    const subjectDiv = document.createElement("div");
    subjectDiv.classList = "flex w-80 flex-col rounded border";

    const header = document.createElement("div");
    header.classList = "flex h-20 flex-col p-2";

    const subjectTitle = document.createElement("p");
    subjectTitle.classList = "text-center";
    subjectTitle.textContent = subject.title;
    header.appendChild(subjectTitle);

    const rating = computeRatings(subject);
    if (rating.averageClarity) {
      const clarityP = document.createElement("p");
      clarityP.textContent = `average clarity: ${rating.averageClarity}`;
      header.appendChild(clarityP);
    }
    if (rating.averageSubjectDifficulty) {
      const subjectDifficultyP = document.createElement("p");
      subjectDifficultyP.textContent = `average subject difficulty: ${rating.averageSubjectDifficulty}`;
      header.appendChild(subjectDifficultyP);
    }

    subjectDiv.appendChild(header);

    const subjectDivider = document.createElement("div");
    subjectDivider.classList = "h-px w-full bg-white";
    subjectDiv.appendChild(subjectDivider);

    const seminarContainer = document.createElement("div");
    seminarContainer.classList = "flex flex-col gap-2 p-2";
    subjectDiv.appendChild(seminarContainer);

    const seminars: { seminarButton: HTMLButtonElement; seminar: Seminar }[] = [];
    for (const seminar of subject.seminars) {
      const seminarButton = document.createElement("button");
      seminarButton.classList =
        "flex h-48 flex-col rounded border p-2 text-start data-[selected=true]:bg-gray-500";
      seminarButton.id = seminar.id;
      seminarButton.dataset.selected = "false";

      const seminarIdP = document.createElement("p");
      seminarIdP.textContent = `id: ${seminar.id}`;
      seminarButton.appendChild(seminarIdP);

      const seminarScheduleP = document.createElement("p");
      const scheduleString = seminar.schedules.reduce(
        (scheduleString, schedule, index) =>
          `${scheduleString}${schedule.day} ${schedule.startTime} - ${schedule.endTime}${index === seminar.schedules.length - 1 ? "" : ", "}`,
        "",
      );
      seminarScheduleP.textContent = `schedule: ${scheduleString}`;
      seminarButton.appendChild(seminarScheduleP);

      const seminarTeacherP = document.createElement("p");
      seminarTeacherP.textContent = "teacher: ";

      const seminarTeacherA = document.createElement("a");
      seminarTeacherA.href = seminar.teacher.link;
      seminarTeacherA.target = "_blank";
      seminarTeacherA.classList = "hover:underline";
      seminarTeacherA.textContent = seminar.teacher.name;
      seminarTeacherP.appendChild(seminarTeacherA);

      if (seminar.teacher.rating) {
        const clarityP = document.createElement("p");
        clarityP.textContent = `clarity: ${seminar.teacher.rating.clarity}`;
        seminarTeacherP.appendChild(clarityP);

        const difficultyP = document.createElement("p");
        difficultyP.textContent = `subject difficulty: ${seminar.teacher.rating.subjectDifficulty}`;
        seminarTeacherP.appendChild(difficultyP);

        if (seminar.teacher.rating.teachingQuality) {
          const teachingQualityP = document.createElement("p");
          teachingQualityP.textContent = `teaching quality: ${seminar.teacher.rating.teachingQuality}`;
          seminarTeacherP.appendChild(teachingQualityP);
        }

        if (seminar.teacher.rating.respect) {
          const respectP = document.createElement("p");
          respectP.textContent = `respect: ${seminar.teacher.rating.respect}`;
          seminarTeacherP.appendChild(respectP);
        }
      }
      seminarButton.appendChild(seminarTeacherP);

      const seminarRegisterLinkP = document.createElement("p");
      const seminarRegisterLinkA = document.createElement("a");
      seminarRegisterLinkA.href = seminar.registerLink;
      seminarRegisterLinkA.target = "_blank";
      seminarRegisterLinkA.classList = "text-blue-200 hover:underline";
      seminarRegisterLinkA.textContent = "registerLink";
      seminarRegisterLinkP.appendChild(seminarRegisterLinkA);
      seminarButton.appendChild(seminarRegisterLinkP);

      seminarButton.addEventListener("click", (event) => handleSelect(event, seminar, subject));

      seminars.push({ seminarButton, seminar });
    }

    seminars.sort((a, b) => {
      const scoreA = a.seminar.teacher.rating?.clarity ?? Infinity;
      const scoreB = b.seminar.teacher.rating?.clarity ?? Infinity;

      return scoreA - scoreB;
    });

    for (const { seminarButton } of seminars) {
      seminarContainer.appendChild(seminarButton);
    }

    document.getElementById("subjects")!.appendChild(subjectDiv);
  }

  /* @ts-expect-error */
  const customForm: HTMLFormElement = document.getElementById("custom-form")!;

  customForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    /* @ts-expect-error */
    const formValues: {
      title: string;
      day: WeekDay;
      from: string;
      to: string;
    } = Object.fromEntries(new FormData(customForm).entries());

    if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(formValues.day)) return;

    const custom: Custom = {
      title: formValues.title,
      id: crypto.randomUUID(),
      schedule: {
        day: formValues.day,
        startTime: formValues.from,
        endTime: formValues.to,
      },
    };

    await addCustom(custom);

    customForm.reset();
  });

  for (const [subject, seminar] of await addedSubjects.entries()) {
    addSubjectToCalendar(subject, seminar);
    const selectedSeminar = document.getElementById(seminar.id)!;
    selectedSeminar.dataset.selected = "true";
  }

  for (const custom of await addedCustoms.entries()) {
    addCleanCustom(custom);
  }
})();
