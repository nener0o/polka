"use client";

import { useActionState } from "react";
import { createReviewAction, updateReviewAction } from "@/actions/reviews";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Review } from "@/lib/types";
import { cn } from "cn";

export function ReviewForm({
  slug,
  review,
}: {
  slug: string;
  review?: Review;
}) {
  const [state, action, pending] = useActionState(
    review ? updateReviewAction : createReviewAction,
    null,
  );
  const values = state?.values;
  const selected = values?.rating ?? String(review?.rating ?? 8);
  return (
    <form action={action} className="flex flex-col gap-4" key={values?.title ?? review?.id ?? "new"}>
      <FormError state={state} />
      <input type="hidden" name="slug" value={slug} />
      {review ? <input type="hidden" name="reviewId" value={review.id} /> : null}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Оценка</legend>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <label key={score}>
              <input
                type="radio"
                name="rating"
                value={score}
                defaultChecked={selected === String(score)}
                className="peer sr-only"
                required
              />
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border border-border text-sm tabular-nums",
                  "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                )}
              >
                {score}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor={review ? `title-${review.id}` : "review-title"}>Заголовок</Label>
        <Input
          id={review ? `title-${review.id}` : "review-title"}
          name="title"
          required
          defaultValue={values?.title ?? review?.title}
          placeholder="Одно предложение, о чём отзыв"
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={review ? `body-${review.id}` : "review-body"}>Текст</Label>
        <Textarea
          id={review ? `body-${review.id}` : "review-body"}
          name="body"
          required
          defaultValue={values?.body ?? review?.body}
          placeholder="Что зашло, что нет. Если можно — без спойлера концовки."
          className="min-h-28"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-10 self-start px-4">
        {pending ? "Сохраняем…" : review ? "Обновить отзыв" : "Опубликовать"}
      </Button>
    </form>
  );
}
