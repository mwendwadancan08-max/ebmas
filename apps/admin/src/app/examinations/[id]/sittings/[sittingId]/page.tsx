"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
    sittingId: string;
  }>;
};

type Sitting = {
  id: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "ENDED" | "TRANSFERRED";
  endedAt: string | null;
  courseUnit: {
    yearOfStudy: number;
    unit: {
      id: string;
      code: string;
      name: string;
    };
    course: {
      id: string;
      code: string;
      name: string;
    };
  };
};

export default function SittingPage({ params }: Props) {
  const { id: examinationId, sittingId } = use(params);

  const [sitting, setSitting] = useState<Sitting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSitting() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/examinations/${examinationId}/sittings`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load sitting");
      }

      const found = data.sittings?.find(
        (item: Sitting) => item.id === sittingId
      );

      if (!found) {
        throw new Error("Exam sitting not found");
      }

      setSitting(found);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sitting"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSitting();
  }, [examinationId, sittingId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <p className="font-bold">Loading exam sitting...</p>
      </main>
    );
  }

  if (error || !sitting) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <Link
          href={`/examinations/${examinationId}/sittings`}
          className="font-bold underline"
        >
          ← Back to Exam Sittings
        </Link>

        <div className="mt-8 border-2 border-black p-6">
          <p className="font-bold">{error || "Sitting not found"}</p>
        </div>
      </main>
    );
  }

  const statusLabel = sitting.status.replace("_", " ");

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href={`/examinations/${examinationId}/sittings`}
          className="font-bold underline"
        >
          ← Exam Sittings
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-wide">
            Exam Sitting
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {sitting.courseUnit.unit.code}
          </h1>

          <p className="mt-2 text-xl font-bold">
            {sitting.courseUnit.unit.name}
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="border-2 border-black p-5">
            <p className="text-sm font-bold uppercase">Course</p>
            <p className="mt-2 text-lg font-black">
              {sitting.courseUnit.course.code}
            </p>
            <p className="font-bold">{sitting.courseUnit.course.name}</p>
          </div>

          <div className="border-2 border-black p-5">
            <p className="text-sm font-bold uppercase">Year of Study</p>
            <p className="mt-2 text-3xl font-black">
              Year {sitting.courseUnit.yearOfStudy}
            </p>
          </div>

          <div className="border-2 border-black p-5">
            <p className="text-sm font-bold uppercase">Status</p>
            <p className="mt-2 text-2xl font-black">{statusLabel}</p>
          </div>
        </section>

        <section className="mt-8 border-2 border-black p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Exam Control</h2>
              <p className="mt-1 font-bold">
                This sitting is controlled by the registered invigilator
                device.
              </p>
            </div>

            <div className="flex gap-3">
              {sitting.status === "SCHEDULED" && (
                <button
                  disabled
                  className="border-2 border-black bg-gray-200 px-5 py-3 font-black"
                >
                  Waiting for Device
                </button>
              )}

              {sitting.status === "IN_PROGRESS" && (
                <button
                  disabled
                  className="border-2 border-black bg-gray-200 px-5 py-3 font-black"
                >
                  End Exam
                </button>
              )}

              {sitting.status === "ENDED" && (
                <button
                  disabled
                  className="border-2 border-black bg-gray-200 px-5 py-3 font-black"
                >
                  Awaiting Reception
                </button>
              )}

              {sitting.status === "TRANSFERRED" && (
                <div className="border-2 border-black px-5 py-3 font-black">
                  Transferred to Archive
                </div>
              )}
            </div>
          </div>

          {sitting.endedAt && (
            <div className="mt-5 border-t-2 border-black pt-5">
              <p className="text-sm font-bold uppercase">Exam Ended</p>
              <p className="mt-1 font-black">
                {new Date(sitting.endedAt).toLocaleString()}
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 border-2 border-black p-6">
          <h2 className="text-2xl font-black">Student Roster</h2>

          <div className="mt-5 border-2 border-dashed border-black p-8 text-center">
            <p className="text-lg font-black">
              Roster will populate from the selected course.
            </p>
            <p className="mt-2 font-bold">
              Booklet recording will happen through the invigilator device.
            </p>
          </div>
        </section>

        <section className="mt-8 border-2 border-black p-6">
          <h2 className="text-2xl font-black">Reception / Transfer</h2>

          <div className="mt-5 border-2 border-dashed border-black p-8 text-center">
            <p className="text-lg font-black">
              No reception code yet.
            </p>
            <p className="mt-2 font-bold">
              The offline device generates the reception code when the exam
              is ended and the submission is ready for transfer.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}