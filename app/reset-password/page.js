import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }) {
  const query = await searchParams;
  return <ResetPasswordForm token={query?.token ?? ""}/>;
}
