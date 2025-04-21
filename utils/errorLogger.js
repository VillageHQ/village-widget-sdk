const titleStyle = `
background: linear-gradient(90deg, rgba(255, 0, 0, 1) 0%, rgba(255, 165, 0, 1) 100%);
color: white;
font-weight: bold;
padding: 8px 12px;
font-size: 16px;
border-radius: 4px;
display: inline-block;
`;

const dividerStyle = `
font-size: 18px;
color: #ff4500;
margin: 8px 0;
font-weight: bold;
text-align: center;
`;

export function logWidgetError(error, context = {}) {
  console.log("%cVILLAGE-PAAS ERROR", titleStyle);
  console.log("%c────────────────────────", dividerStyle);

  const errorData = [
    {
      label: "ERROR MESSAGE",
      value: error.message,
    },
    {
      label: "STACK TRACE",
      value: error.stack,
    },
    {
      label: "CONTEXT",
      value: JSON.stringify(context, null, 2),
    },
  ];

  for (const { label, value } of errorData) {
    console.log("%c" + label, "padding: 4px; font-weight: bold;");
    console.log("%c" + value, "padding: 4px;");
  }

  console.log("%c────────────────────────", dividerStyle);
}
