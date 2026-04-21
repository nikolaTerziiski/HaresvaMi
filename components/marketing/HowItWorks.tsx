type Step = {
  number: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Сканирай бона",
    description: "Сервитьорът сканира бона с камерата след плащане.",
  },
  {
    number: "02",
    title: "Гостът оценява",
    description:
      "Всяко ядене от бона получава собствена оценка — не само общо впечатление.",
  },
  {
    number: "03",
    title: "Виждаш кое харесват",
    description:
      "Ежедневни обобщения на кое ястие работи добре и кое пада в оценките.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-ink-100 px-6 py-16 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <p className="mb-4 font-medium text-sm text-ink-500">Как работи</p>
          <h2 className="font-bold tracking-tight text-2xl text-ink-900">
            Три стъпки между плащането и обратната връзка
          </h2>
        </div>

        <ol className="grid gap-10 sm:gap-12 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="flex flex-col">
              <span className="mb-5 font-medium text-sm tracking-wider text-coral-700">
                {step.number}
              </span>
              <h3 className="font-bold text-lg text-ink-900">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-base text-ink-700">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
