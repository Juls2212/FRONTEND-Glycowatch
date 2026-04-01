type Props = {
  type: "success" | "error" | "info";
  message: string;
};

export function FeedbackBanner({ type, message }: Props) {
  return <p className={`feedback-banner ${type}`}>{message}</p>;
}

export function SuccessBanner({ message }: Omit<Props, "type">) {
  return <FeedbackBanner type="success" message={message} />;
}

