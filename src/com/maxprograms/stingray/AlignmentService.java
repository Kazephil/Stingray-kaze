/*****************************************************************************
Copyright (c) 2008-2020 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

package com.maxprograms.stingray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.Convert;
import com.maxprograms.converters.EncodingResolver;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class AlignmentService {

	private static Logger logger = System.getLogger(AlignmentService.class.getName());
	protected boolean aligning;
	protected String alignError;
	protected String status;

	public AlignmentService() {

	}

	public JSONObject getLanguages() {
		JSONObject result = new JSONObject();
		try {
			List<Language> languages = LanguageUtils.getCommonLanguages();
			JSONArray array = new JSONArray();
			for (int i = 0; i < languages.size(); i++) {
				Language lang = languages.get(i);
				JSONObject json = new JSONObject();
				json.put("code", lang.getCode());
				json.put("description", lang.getDescription());
				array.put(json);
			}
			result.put("languages", array);
		} catch (SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, "Error getting languages", e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	public JSONObject getTypes() {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		String[] formats = FileFormats.getFormats();
		for (int i = 0; i < formats.length; i++) {
			if (!FileFormats.isBilingual(formats[i])) {
				JSONObject json = new JSONObject();
				json.put("code", FileFormats.getShortName(formats[i]));
				json.put("description", formats[i]);
				array.put(json);
			}
		}
		result.put("types", array);
		return result;
	}

	public JSONObject getCharsets() {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		TreeMap<String, Charset> charsets = new TreeMap<>(Charset.availableCharsets());
		Set<String> keys = charsets.keySet();
		Iterator<String> i = keys.iterator();
		while (i.hasNext()) {
			Charset cset = charsets.get(i.next());
			JSONObject json = new JSONObject();
			json.put("code", cset.name());
			json.put("description", cset.displayName());
			array.put(json);
		}
		result.put("charsets", array);
		return result;
	}

	public JSONObject getFileType(String file) {
		JSONObject result = new JSONObject();
		result.put("file", file);
		String detected = FileFormats.detectFormat(file);
		if (detected != null) {
			String type = FileFormats.getShortName(detected);
			if (type != null) {
				Charset charset = EncodingResolver.getEncoding(file, detected);
				if (charset != null) {
					result.put("charset", charset.name());
				}
			}
			result.put("type", type);
		}
		return result;
	}

	public JSONObject alignFiles(JSONObject json) {
		JSONObject result = new JSONObject();
		aligning = true;
		alignError = "";
		status = "";
		try {
			new Thread() {

				@Override
				public void run() {
					try {
						status = "Processing source";
						logger.log(Level.INFO, status);
						File srcXlf = File.createTempFile("file", ".xlf");
						srcXlf.deleteOnExit();
						File skl = File.createTempFile("file", ".skl");
						Map<String, String> params = new HashMap<>();
						params.put("source", json.getString("sourceFile"));
						params.put("srcLang", json.getString("srcLang"));
						params.put("xliff", srcXlf.getAbsolutePath());
						params.put("skeleton", skl.getAbsolutePath());
						params.put("format", FileFormats.getFullName(json.getString("srcType")));
						params.put("catalog", json.getString("catalog"));
						params.put("srcEncoding", json.getString("srcEnc"));
						params.put("paragraph", json.getBoolean("paragraph") ? "yes" : "no");
						params.put("srxFile", json.getString("srx"));
						List<String> res = Convert.run(params);
						if (!com.maxprograms.converters.Constants.SUCCESS.equals(res.get(0))) {
							alignError = res.get(1);
							status = "";
							aligning = false;
							return;
						}
						Files.delete(skl.toPath());

						status = "Processing target";
						logger.log(Level.INFO, status);
						File tgtXlf = File.createTempFile("file", ".xlf");
						tgtXlf.deleteOnExit();
						skl = File.createTempFile("file", ".skl");
						params = new HashMap<>();
						params.put("source", json.getString("targetFile"));
						params.put("srcLang", json.getString("tgtLang"));
						params.put("xliff", tgtXlf.getAbsolutePath());
						params.put("skeleton", skl.getAbsolutePath());
						params.put("format", FileFormats.getFullName(json.getString("tgtType")));
						params.put("catalog", json.getString("catalog"));
						params.put("srcEncoding", json.getString("tgtEnc"));
						params.put("paragraph", json.getBoolean("paragraph") ? "yes" : "no");
						params.put("srxFile", json.getString("srx"));
						res = Convert.run(params);
						if (!com.maxprograms.converters.Constants.SUCCESS.equals(res.get(0))) {
							alignError = res.get(1);
							status = "";
							aligning = false;
							return;
						}
						Files.delete(skl.toPath());

						status = "Aligning Files";
						logger.log(Level.INFO, status);
						try (FileOutputStream out = new FileOutputStream(json.getString("alignmentFile"))) {
							writeStr(out, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
							writeStr(out, "<algnproject version=\"" + Constants.VERSION + "\" build=\""
									+ Constants.BUILD + "\">\n");

							SAXBuilder builder = new SAXBuilder();
							Document doc = builder.build(srcXlf);
							List<Element> sources = new ArrayList<>();
							recurse(sources, doc.getRootElement());

							writeStr(out, "<sources xml:lang=\"" + json.getString("srcLang") + "\">\n");
							Iterator<Element> it = sources.iterator();
							while (it.hasNext()) {
								writeStr(out, clean(it.next()) + "\n");
							}
							writeStr(out, "</sources>\n");
							Files.delete(srcXlf.toPath());

							sources = new ArrayList<>();
							doc = builder.build(tgtXlf);
							recurse(sources, doc.getRootElement());

							writeStr(out, "<targets xml:lang=\"" + json.getString("srcLang") + "\">\n");
							it = sources.iterator();
							while (it.hasNext()) {
								writeStr(out, clean(it.next()) + "\n");
							}
							writeStr(out, "</targets>\n");
							Files.delete(tgtXlf.toPath());

							writeStr(out, "</algnproject>");
						}
						status = "";
						aligning = false;
						logger.log(Level.INFO, "Alignment completed");
					} catch (IOException | SAXException | ParserConfigurationException e) {
						logger.log(Level.ERROR, e);
						alignError = e.getMessage();
						status = "";
						aligning = false;
					}
				}

				private void recurse(List<Element> sources, Element e) {
					if (e.getName().equals("trans-unit")) {
						sources.add(e.getChild("source"));
					} else {
						List<Element> list = e.getChildren();
						Iterator<Element> it = list.iterator();
						while (it.hasNext()) {
							recurse(sources, it.next());
						}
					}
				}

				private void writeStr(FileOutputStream out, String string) throws IOException {
					out.write(string.getBytes(StandardCharsets.UTF_8));
				}

				private String clean(Element e) {
					e.setAttributes(new ArrayList<>());
					return e.toString();
				}

			}.start();
			result.put(Constants.STATUS, Constants.SUCCESS);
			return result;
		} catch (IllegalThreadStateException e) {
			logger.log(Level.ERROR, e);
			alignError = e.getMessage();
			status = "";
			aligning = false;
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	public JSONObject alignmentStatus() {
		JSONObject result = new JSONObject();
		result.put("aligning", aligning);
		result.put("alignError", alignError);
		result.put("status", status);
		return result;
	}
}
