// File: Code.gs — SynergIA – Processador NF-e (com coluna Email)
const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_XML_BYTES = 2 * 1024 * 1024;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
                    .setTitle('SynergIA – Processador NF-e');
}

function processXmlFile(files, userEmail) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById('1Sw7uJcJwTTnrmas_n6N6qQ0T-Z0h6naSsJNUWDBTTug'); // sua planilha
    const sheetName = 'NFe Data';
    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    const expectedHeadersBase = [
      'File Name','Chave de Acesso','CNPJ Emissor','Nome Emissor','UF Emissor',
      'Endereço Emissor','CNPJ Destinatário','Nome Destinatário','UF Destinatário',
      'Endereço Destinatário','CFOP','NCM','Valor Total','Data Emissão','Número NF',
      'Entrada (tpNF=0)','Saída (tpNF=1)','Inscrição Estadual','Inscrição Municipal',
      'IE Subst_Trib','CEP Emissor','CEP Destinatário','Origem/CST','CSOSN','Descrição Produto'
    ];
    const expectedHeaders = [...expectedHeadersBase, 'Email'];

    // Migração suave do cabeçalho (acrescenta "Email" se faltar)
    const lastCol = sheet.getLastColumn();
    const current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    const joinedCurrent = current.join();
    const joinedExpected = expectedHeaders.join();
    const joinedExpectedBase = expectedHeadersBase.join();

    if (!lastCol) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    } else if (joinedCurrent === joinedExpectedBase) {
      // Só faltava a coluna Email
      sheet.getRange(1, lastCol + 1).setValue('Email');
    } else if (joinedCurrent !== joinedExpected) {
      // Cabeçalho inesperado → alinhar com o novo (mantém simples)
      sheet.clear();
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    }

    const results = [];
    const rowsToWrite = [];

    const lastRow = sheet.getLastRow();
    const keyIndex = 2;
    const existingKeys = new Set();
    const existingData = new Map();

    const readCols = Math.max(sheet.getLastColumn(), expectedHeaders.length);
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, readCols).getValues();
      data.forEach(r => {
        const k = (r[keyIndex - 1] || '').toString().trim();
        if (k) {
          existingKeys.add(k);
          existingData.set(k, r);
        }
      });
    }

    files.forEach(file => {
      try {
        if (!file.content || file.content.trim() === '') throw new Error('Arquivo vazio ou inválido');

        let xmlFiles = [];
        if (file.name.toLowerCase().endsWith('.zip')) {
          const b64 = file.content.split(',')[1];
          const raw = Utilities.base64Decode(b64);
          if (raw.length > MAX_ZIP_BYTES) throw new Error(`ZIP "${file.name}" excede 10MB`);
          const blob = Utilities.newBlob(raw, 'application/zip', file.name);
          xmlFiles = Utilities.unzip(blob)
            .filter(b => b.getName().toLowerCase().endsWith('.xml'))
            .map(b => ({ name: b.getName(), content: b.getDataAsString() }));
          if (!xmlFiles.length) throw new Error('Nenhum arquivo XML encontrado no ZIP');
        } else {
          if (Utilities.newBlob(file.content).getBytes().length > MAX_XML_BYTES)
            throw new Error(`XML "${file.name}" excede 2MB`);
          xmlFiles.push({ name: file.name, content: file.content });
        }

        xmlFiles.forEach(xf => {
          try {
            const doc = XmlService.parse(xf.content);
            const root = doc.getRootElement();
            const ns = XmlService.getNamespace('http://www.portalfiscal.inf.br/nfe');

            const nfe = root.getChild('NFe', ns);
            const infNFe = nfe?.getChild('infNFe', ns);
            if (!infNFe) throw new Error('Elemento infNFe não encontrado');

            let accessKey = root.getChild('protNFe', ns)?.getChild('infProt', ns)?.getChild('chNFe', ns)?.getText() || '';
            if (!accessKey) {
              const idAttr = infNFe.getAttribute('Id')?.getValue() || '';
              const possible = idAttr.replace(/[^\d]/g, '').substring(0, 44);
              if (possible.length === 44) accessKey = possible;
            }
            accessKey = accessKey.trim();

            const isDuplicate = existingKeys.has(accessKey);
            if (isDuplicate) {
              const row = existingData.get(accessKey) || [];
              results.push({
                success: false,
                duplicate: true,
                message: `NF com chave ${accessKey} já existe — ignorada.`,
                data: {
                  fileName: row[0], accessKey: row[1],
                  cnpjEmit: row[2], emitName: row[3], emitUF: row[4], emitAddress: row[5],
                  cnpjDest: row[6], destName: row[7], destUF: row[8], destAddress: row[9],
                  cfops: row[10], ncms: row[11], totalValue: row[12], emissionDate: row[13],
                  nfNumber: row[14], entrada: row[15], saida: row[16],
                  ieEmit: row[17], imEmit: row[18], iestEmit: row[19],
                  cepEmit: row[20], cepDest: row[21], origCst: row[22], csosn: row[23], descrProds: row[24]
                }
              });
              return;
            }

            const emit = infNFe.getChild('emit', ns);
            const cnpjEmit = emit?.getChild('CNPJ', ns)?.getText() || '';
            const emitName = emit?.getChild('xNome', ns)?.getText() || '';
            const ieEmit = emit?.getChild('IE', ns)?.getText() || '';
            const imEmit = emit?.getChild('IM', ns)?.getText() || '';
            const iestEmit = emit?.getChild('IEST', ns)?.getText() || '';

            const enderEmit = emit?.getChild('enderEmit', ns);
            const emitUF = enderEmit?.getChild('UF', ns)?.getText() || '';
            const cepEmit = enderEmit?.getChild('CEP', ns)?.getText() || '';
            const emitAddress = `${enderEmit?.getChild('xLgr', ns)?.getText() || ''}, ${enderEmit?.getChild('nro', ns)?.getText() || ''}, ${enderEmit?.getChild('xBairro', ns)?.getText() || ''}, ${enderEmit?.getChild('xMun', ns)?.getText() || ''}/${emitUF}`;

            const dest = infNFe.getChild('dest', ns);
            const cnpjDest = dest?.getChild('CNPJ', ns)?.getText() || dest?.getChild('CPF', ns)?.getText() || '';
            const destName = dest?.getChild('xNome', ns)?.getText() || '';
            const enderDest = dest?.getChild('enderDest', ns);
            const destUF = enderDest?.getChild('UF', ns)?.getText() || '';
            const cepDest = enderDest?.getChild('CEP', ns)?.getText() || '';
            const destAddress = `${enderDest?.getChild('xLgr', ns)?.getText() || ''}, ${enderDest?.getChild('nro', ns)?.getText() || ''}, ${enderDest?.getChild('xBairro', ns)?.getText() || ''}, ${enderDest?.getChild('xMun', ns)?.getText() || ''}/${destUF}`;

            const dets = infNFe.getChildren('det', ns);
            const cfops = [], ncms = [], origCstArray = [], descrProds = [], csosns = [];
            dets.forEach(d => {
              const prod = d.getChild('prod', ns);
              cfops.push(prod?.getChild('CFOP', ns)?.getText() || '');
              ncms.push(prod?.getChild('NCM', ns)?.getText() || '');
              descrProds.push(prod?.getChild('xProd', ns)?.getText() || '');
              const icms = d.getChild('imposto', ns)?.getChild('ICMS', ns);
              const icmsChild = icms?.getChildren()[0];
              if (icmsChild) {
                const orig = icmsChild.getChild('orig', ns)?.getText() || '';
                const cst = icmsChild.getChild('CST', ns)?.getText();
                const csosn = icmsChild.getChild('CSOSN', ns)?.getText();
                if (csosn && !cst) {
                  csosns.push(`${orig}/${csosn}`); origCstArray.push('');
                } else if (cst && !csosn) {
                  origCstArray.push(`${orig}/${cst}`); csosns.push('');
                } else { csosns.push(''); origCstArray.push(''); }
              } else { csosns.push(''); origCstArray.push(''); }
            });

            const total = infNFe.getChild('total', ns)?.getChild('ICMSTot', ns);
            const totalValue = total?.getChild('vNF', ns)?.getText() || '';
            const ide = infNFe.getChild('ide', ns);
            const tpNF = ide?.getChild('tpNF', ns)?.getText() || '';
            const entradaFlag = tpNF === '0' ? '1' : '';
            const saidaFlag = tpNF === '1' ? '1' : '';
            const emissionDate = ide?.getChild('dhEmi', ns)?.getText() || '';
            const nfNumber = ide?.getChild('nNF', ns)?.getText() || '';

            const row = [
              xf.name, accessKey, cnpjEmit, emitName, emitUF, emitAddress,
              cnpjDest, destName, destUF, destAddress,
              cfops.join('; '), ncms.join('; '),
              totalValue, emissionDate, nfNumber,
              entradaFlag, saidaFlag,
              ieEmit, imEmit, iestEmit,
              cepEmit, cepDest,
              origCstArray.filter(Boolean).join('; '),
              csosns.filter(Boolean).join('; '),
              descrProds.join('; '),
              userEmail || '' // <- NOVO: Email
            ];
            rowsToWrite.push(row);

            results.push({
              success: true,
              message: `Arquivo ${xf.name} processado com sucesso.`,
              data: {
                fileName: xf.name, accessKey, cnpjEmit, emitName, emitUF, emitAddress,
                cnpjDest, destName, destUF, destAddress,
                cfops: cfops.join('; '), ncms: ncms.join('; '),
                totalValue, emissionDate, nfNumber,
                entrada: entradaFlag, saida: saidaFlag,
                ieEmit, imEmit, iestEmit,
                cepEmit, cepDest,
                origCst: origCstArray.filter(Boolean).join('; '),
                csosn: csosns.filter(Boolean).join('; '),
                descrProds: descrProds.join('; ')
              }
            });
          } catch (err) {
            results.push({ success: false, message: `Erro ao processar ${xf.name}: ${err.message}` });
          }
        });
      } catch (err) {
        results.push({ success: false, message: `Erro ao processar ${file.name}: ${err.message}` });
      }
    });

    const seen = new Set();
    const uniqueRows = rowsToWrite.filter(r => {
      const key = r[1];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniqueRows.length) {
      // manter lock só na escrita
      sheet.getRange(sheet.getLastRow() + 1, 1, uniqueRows.length, expectedHeaders.length)
           .setValues(uniqueRows);
    }

    if (!Array.isArray(results)) return [{ success: false, message: 'Erro: resultados inválidos' }];
    return results;
  } catch (err) {
    return [{ success: false, message: `Erro geral: ${err.message}` }];
  } finally {
    lock.releaseLock();
  }
}
