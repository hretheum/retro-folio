const handler = (req: any, res: any) => {
  res.status(200).json({ message: 'Hello from API!' });
};

export default handler;