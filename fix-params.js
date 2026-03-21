const fs = require('fs');
const path = 'app/(app)/messages/[userId]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('import { useState, useEffect, useRef } from \\'react\\'', 'import React, { useState, useEffect, useRef } from \\'react\\'')
code = code.replace('export default function DirectChatPage({ params }: { params: { userId: string } }) {', 
  'export default function DirectChatPage({ params }: { params: Promise<{ userId: string }> }) {\\n  const { userId } = React.use(params)')
code = code.replaceAll('params.userId', 'userId');

fs.writeFileSync(path, code);
console.log('Fixed params access in DirectChatPage');
