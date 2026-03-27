type Props = {
  type: "success" | "error" | "info";
  message: string;
};

export function FeedbackBanner({ type, message }: Props) {
  return <p className={`feedback-banner ${type}`}>{message}</p>;
}

