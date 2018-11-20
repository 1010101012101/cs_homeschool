// file names

// const jobsListfs = './2018/jobs_test.txt',
const hnurlid = '18354503';

const date = new Date(),
	month = date.getMonth(),
	yr = date.getFullYear();
const jobsList = `${yr}/jobs_m${month}`,
	jobsListfs = jobsList + '.txt',
	sentEmailsfs = jobsList + '_emailsbackup_alreadysent.txt',
	outputApplScriptfs = jobsList + '_final.scpt',
	tstAs = outputApplScriptfs + 'test',
	rejectsfs = jobsList+'_rejects.txt',
	rawEmailListfs = jobsList+'_emails.txt',
	salariesFs = jobsList+'_salaries.txt',
	remoteFs = jobsList+'_remotes.txt',
	remoteJobsRejectsFs = jobsList+'_remotes_rejects.txt';

const fs = require('fs');
const https = require('https');
// const $ = require('jQuery');
var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window);
// console.log($.parseHTML)
// return
// let txt = fs.readFileSync(jobsListfs);
// txt += '';
// let lines = txt.split('\n');
// txt = txt.split('\n');

// vars for fetching hn jobs txt
let oldDat = '';
let fullDat = '';

let blocks = [],
	emails = [],
	allroles = [],
	salaries = [],
	remoteJobs = [],
	rejects = [],
	remoteJobsRejects = [];

let sentEmails;
if (fs.existsSync(sentEmailsfs)) {
	sentEmails = fs.readFileSync(sentEmailsfs, 'utf8').split('\n');
} else {
	sentEmails = [];
}

// block level
let block = false,
	blockbuf = '',
	roles = [],
	matchingKeywords = [],
	postername;

let matcheskeywords = 0;
// push first test block
// console.log(lines.length);

// (async () => {
// 	await getHNPosts(1);
// })()
getHNPosts(1).then(x => {
	main();
})
function main() {
	populateBlocks();
	let asc = genAsAll(blocks);
	// console.log(i);
	// console.log(rejects);
	// console.log(emails);
	// console.log(emails);
	// console.log(blocks);
	// console.log(dedupeArr(allroles));
	// console.log(genAsAll(blocks));
	// console.log(lines);
	console.log('emails ', emails.length);
	console.log('rejects ', rejects.length);
	console.log('keyword matches ', matcheskeywords);
	//  MAIN FILE OUTPUTS ===========================>
	let tb = blocks[0];
	tb.e = ["hi@kaustav.me", "kausthal@gmail.com", "hi@kaustav.me"];
	fs.writeFileSync(tstAs, genAS(tb));

	fs.writeFileSync(outputApplScriptfs, asc);
	fs.writeFileSync(rejectsfs, rejects.join("\n"));
	fs.writeFileSync(rawEmailListfs, emails.join("\n"));
	fs.writeFileSync(salariesFs, salaries.join("\n"));
	fs.writeFileSync(remoteFs, remoteJobs.join('\n'));
	fs.writeFileSync(remoteJobsRejectsFs, remoteJobsRejects.join("\n"));
}
//========================================= End
// Functions

function populateBlocks() {
	let txt = fs.readFileSync(jobsListfs);
	txt += '';
	let lines = txt.split('\n');
	for (var i = 0; i < lines.length; i++) {
		let tl = lines[i];
		if (tl.indexOf('ago [-]') > -1 || i == lines.length - 1 || tl.indexOf('|') > -1) {

			if (!block) {
				block = true;
			} else {
				// new block
				let etxt = parseEmailFromBlock(blockbuf),
					keywords = parseBuzzwords(blockbuf);
				
				// generate keyword match stats
				if (keywords.length) matcheskeywords++;

				// prioritize jobs that list salary
				let slr = grabSalary(blockbuf);
				if (slr) salaries.push(slr);

				// grab and prioritize remote jobs
				if (isRemote(blockbuf)) remoteJobs.push(blockbuf);

				// if (etxt[0] == 'null') console.log(blockbuf);
				if (etxt.length > 0 && etxt[0] != 'null' && 
					// desperate for remote jobs, but dont apply to others if we dont have keyword match
					(keywords.length > 0 || isRemote(blockbuf))) {
					emails.push(etxt);
					if (roles.length > 0) {
						roles = roles[0];
						roles = roles.split(',');
						allroles = allroles.concat(roles);
					}
					blocks.push({
						e: etxt,
						txt: 'blockbuf',
						r: roles,
						n: postername,
						k: keywords
					});
				} else {
					rejects.push(blockbuf);

					// grab and prioritize remote jobs we missed
					if (isRemote(blockbuf)) remoteJobsRejects.push(blockbuf);
				}
				postername = null;
				blockbuf = '';
				roles = [];
			}
			// set postername
			postername = tl.split(/\s+/)[0];
		}
		if (block) {
			blockbuf += tl + '\n';
			if (tl.match(/\|/)) roles.push(tl);
		}
	}
}

function grabSalary(blk) {
	let lines = blk.split('\n');
	if (!lines || lines.length < 3) return;
	let salary = lines[2].match(/\$\d+/);
	if (salary && lines[2].match(/\d+/) >= 100) {
		return lines[2].match(/\$\d+/) + ' == ' + lines[2];
	}
}

function isRemote(blk) {
	if (blk.match(/remote/gi) && blk.match(/\|/gi)) return blk;
}

function parseEmailFromBlock(t, iteration) {
	let emailRx = /[a-z0-9\.\@\-\_\+]+/gi;
	let l = t.split('\n'),
		buf = '';
	for (var i = 0; i < l.length; i++) {
		let tl = l[i];
		let words = tl.match(emailRx);

		if (!words) words = [];
		for (var j = 0; j < words.length; j++) {
			let word = words[j],
				tb = '';

			if (word.match(/email/gi) ||
				word.match(/e-mail/gi)) {
				let start = j < 0 ? 0 : j,
					end = j + 20 > words.length ? words.length : j + 20;
				tb += words.slice(start, end).join(" ");

			} else if (word.match(/\[at\]/gi) ||
				word.match(/\(at\)/gi) ||
				word.match(/\<at\>/gi) ||
				word.match(/\{at\}/gi) ||
				word.indexOf("@") > -1) {
				console.log('at');
				let start = j - 5 < 0 ? 0 : j - 5,
					end = j + 5 > words.length ? words.length : j + 5;
				tb += words.slice(start, end).join(" ");
			} else if (word.match(/\[dot\]/gi) ||
				word.match(/\(dot\)/gi) ||
				word.match(/\s*dot\s*/gi) ||
				word.match(/\s*\[\.\]\s*/gi) ||
				word.match(/\<dot\>/gi) ||
				word.match(/\{dot\}/gi) ||
				word.match(/\<.\>/gi) ||
				word.match(/\{.\}/gi) ||
				word.match(/\s*\(\.\)\s*/gi)) {
				console.log('dot', word);
				let start = j - 5 < 0 ? 0 : j - 5,
					end = j + 5 > words.length ? words.length : j + 5;

				tb += words.slice(start, end).join(" ");
			}

			if (tb.length > 0) console.log('1', tb);

			tb = tb.replace(/\s*\[at\]\s*/gi, '@');
			// tb = tb.replace(/\s+at\s+/gi, '@');
			tb = tb.replace(/\s*\[@\]\s*/gi, '@');
			tb = tb.replace(/\s*\(at\)\s*/gi, '@');
			tb = tb.replace(/\s*\<at\>\s*/gi, '@');
			tb = tb.replace(/\s*\{at\}\s*/gi, '@');

			tb = tb.replace(/\s*\(@\)\s*/gi, '@');
			tb = tb.replace(/\s\@\s/gi, '@');

			// tb = tb.replace(/\s*dot\s*/gi, '.');
			tb = tb.replace(/\s*\[dot\]\s*/gi, '.');
			tb = tb.replace(/\s*\(dot\)\s*/gi, '.');
			tb = tb.replace(/\s*\(\.\)\s*/gi, '.');
			tb = tb.replace(/\s*\[\.\]\s*/gi, '.');
			tb = tb.replace(/\s*\<dot\>\s*/gi, '.');
			tb = tb.replace(/\s*\{dot\}\s*/gi, '.');
			tb = tb.replace(/\s*\<\.\>\s*/gi, '.');
			tb = tb.replace(/\s*\{\.\}\s*/gi, '.');

			// fuck you jeff
			tb = tb.replace(" __4t__ ", '@');

			if (tb.length > 0) console.log('2', tb);
			buf += " " + tb;
		}

	}

	buf = buf.trim();
	let posems = [];
	// further process valid emails
	if (buf.indexOf('@') > -1 && buf.indexOf(".") > -1) {
		let ws = buf.match(emailRx);
		for (var i = 0; i < ws.length; i++) {
			let w = ws[i];
			if (w.indexOf('@') > -1 && w.indexOf(".") > -1) {
				if (w.match(/@/gi).length > 1) {
					w = w.split("@").splice(1, 2).join("@");
					w = w.match(/[a-z]+.*\@[a-z]+/gi) + w.match(/\.[a-z]+/gi);
				}

				if (w.length > 0) console.log('1', w);
				w = w.match(/[a-z0-9\.\-\_\+]+\@[a-z0-9\-\.]+\.+[a-z0-9]+/gi) + '';

				// fix .coms
				if (w.match(/.com/)) w.replace(/.com[a-z]+/, '.com');

				// filter out common false matches and people using gmail
				if (!w.match(/name/) && !w.match(/http/) && !w.match(/www/)
					&& !w.match(/gmail/)) posems.push(w);
			}
		}
	}

	if (posems.length == 0) {
		if (!iteration == 1) posems = parseEmailFromBlock(parseLine2(t), 1);
	}

	// do not email peope again************************************
	//IMPORTANT
	posems = dedupeArr(posems);
	let out = [];
	if (sentEmails.indexOf(posems.join(",")) === -1) out = posems;
	
	return out;
}

function parseLine2(tb) {
	console.log(tb);

	tb = tb.replace(/\s*\[dot\]\s*/gi, '.');
	tb = tb.replace(/\s*\(dot\)\s*/gi, '.');
	tb = tb.replace(/\s*\(\.\)\s*/gi, '.');
	tb = tb.replace(/\s*\[\.\]\s*/gi, '.');
	tb = tb.replace(/\s*\<dot\>\s*/gi, '.');
	tb = tb.replace(/\s*\{dot\}\s*/gi, '.');
	tb = tb.replace(/\s*\<\.\>\s*/gi, '.');
	tb = tb.replace(/\s*\{\.\}\s*/gi, '.');
	tb = tb.replace(/\s+dot\s+/gi, '.');

	tb = tb.replace(/\s*\[at\]\s*/gi, '@');
	tb = tb.replace(/\s+at\s+/gi, '@');
	tb = tb.replace(/\s*\[@\]\s*/gi, '@');
	tb = tb.replace(/\s*\(at\)\s*/gi, '@');
	tb = tb.replace(/\s*\<at\>\s*/gi, '@');
	tb = tb.replace(/\s*\{at\}\s*/gi, '@');
	tb = tb.replace(/\s*\(@\)\s*/gi, '@');
	tb = tb.replace(/\s\@\s/gi, '@');

	// thx dalan...
	tb = tb.replace(/\s*chr\(43\)\s*/, '+');
	tb = tb.replace(/\s*chr\(64\)\s*/, '@');
	tb = tb.replace(/\s*chr\(46\)\s*/, '.');

	console.log('parseLine2', tb, '\n');
	return tb;
}

// dedupe an array and also cast everything to lowercase
function dedupeArr(arr) {
	let o = {},
		o2 = [];
	if (arr.length == 0) return arr;
	// console.log(arr);
	for (var i = 0; i < arr.length; i++) {
		o[arr[i].toLowerCase()] = true;
	}
	for (let k in o) {
		o2.push(k);
	}
	return o2;
}

function parseBuzzwords(txt) {
	let krax = "Go, golang, Lua, JS, Python, Ruby, Java, C++, Bash;  Hadoop, Hive, Kafka, MongoDB, ElasticSearch, Logstash, Kibana, Grafana, Docker, Chef, Travis, Jenkins, Ansible zookeeper".
	match(/[a-z]+/gi),
		kspark = "MongoDB/NoSQL, ExpressJS, AngularJS, NodeJS, Nginx, AWS, javascript. angular, node".match(/[a-z]+/gi),
		python = ["pip", "python", "anaconda"],
		keth = "blockchain ethereum hyperledger solidity truffle".match(/[a-z]+/gi);
	let keywords = [
		"python", "ruby", "java", "c++", "lua", "bash", "shell", "scripting",
		"mongodb", "mysql", "sql", "hadoop", "hive",
		"kafka", "grafana", "zookeeper",
		"chef", "ansible", "travis", "jenkins", "kubernetes",
		"rails", "coffeescript",
		"bootstrap", "nodejs",
		"blockchain", "ethereum", "solidity", "hyperledger",
		"redis", "node", "php", "rails",
		"backend", "web", "mobile", "REST", "cassandra",
		"linux", "nginx", "apache", "open source"
	];

	let keywordsMap = {
		"AWS": ['aws', 'amazon'],
		'docker': ['docker', 'containers'],
		'javascript': ['es6', 'js', 'javascript', 'es7', 'esnext'],
		'react': ['react', 'reactjs', "react-native", 'redux', 'mobex'],
		'angular': ['angular', 'angularjs'],
		'go': ['golang', 'go'],
		'elk': ['kibana', 'logstash', 'elasticsearch']
	}

	let words = txt.match(/[a-z]+/gi),
		out = [];

	for (var i = 0; i < words.length; i++) {
		let twlc = words[i].toLowerCase();

		if (keywords.indexOf(twlc) != -1) out.push(keywords[keywords.indexOf(twlc)]);

		for (key in keywordsMap) {
			if (keywordsMap[key].indexOf(twlc) != -1) out.push(key);
		}
	}

	// match open source
	if (txt.match(/open source/gi)) out.push('opensource');
	return dedupeArr(out);
}

function genAsAll(obj) {
	let c = '';
	for (ki in obj) {
		c += genAS(obj[ki]);
		c += genRandDelay();
	}
	return c;
}


function genRandDelay() {
	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
	}
	let val = getRandomInt(5,30);
	return `\n delay ${val} \n`;
}

// Amazon, Apple, Evernote, Facebook, Google, LinkedIn, Microsoft, Oracle, any Y Combinator startup, Yelp, and Zynga.
function genAS(obj) {
	let defaultsubject = "HackerNews FT SE opportunities";
	let fcontent = '';

	let krax = "Go, golang, Lua, JS, Python, Ruby, Java, C++, Bash;  Hadoop, Hive, Kafka, MongoDB, ElasticSearch, Logstash, Kibana, Grafana, Docker, Chef, Travis, Jenkins, Ansible zookeeper".
	match(/[a-z]+/gi),
		kspark = "MongoDB/NoSQL, ExpressJS, AngularJS, NodeJS, Nginx, AWS, javascript".match(/[a-z]+/gi),
		python = ["pip", "python", "anaconda"],
		keth = "blockchain ethereum hyperledger solidity truffle".match(/[a-z]+/gi),
		addketh = false,
		addoss = false;

	let content = '';
	let o = obj,
		e = o.e,
		txt = o.txt,
		r = o.r,
		n = o.n,
		k = o.k;

	let mainEmail = e[0];

	function addline(txt) {
		content += txt + "\n";
	}

	function checkForOpensourceOrEth(keyword) {
		return keyword === 'opensource' || keth.indexOf(keyword) > -1;
	}

	addline("Hi,");
	addline("");
	addline("I came across your post on Hacker News and wanted to inquire if you were still interviewing for any FT SE roles.");

	// add keywords
	if (k.length > 0) {


		// trim secondary keywords if any for addition later and toggle flag for open source/eth
		for (var i = 0; i < k.length; i++) {
			let keyword = k[i];
			if (checkForOpensourceOrEth(keyword)) {
				k.splice(i, 1);
			}
			if (keyword === 'opensource') addoss = true;
			if (match(k, keth)) addketh = true;
		}

		let kstr = '';
		kstr += "I have experience with ";

		if (k.length > 1) {
			for (var i = 0; i < k.length - 1; i++) {
				kstr += k[i] + ', ';
			}
			kstr += k[k.length - 1];
		} else {
			kstr += k[0];
		}
		kstr += " and noticed them in the post."
		addline(kstr);

		// highlight blockchain exp
		if (addketh) {
			addline("I’ve been following blockchain projects like ethereum, dash, ripple, bitcoin etc for a while and have read many whitepapers. I worked on a prototype ethereum ui before mist. More recently I won a prize at Ethwaterloo for prototyping an identity management / social network layer protocol for ethereum. I've also helped organize and run workshops at a ethereum developer meetup and worked on hyperledger projects within IBM");
		}
		if (addoss) {
			addline("I'm a big proponent of open source with commits made and merged into 10+ projects including Pythons pip & FBs HHVM PHP compiler")
		}
	}

	function match(a1, a2) {
		for (var i = 0; i < a1.length; i++) {
			if (a2.indexOf(a1[i]) > -1) return true;
		}
		return false;
	}

	// highlight python pip commit
	// if (){}

	// highlight data engineering @ rax w/ go

	addline("Here's my resume: <a href='http://kaustavha.github.io/kaustav-haldar-resume/'>bit.ly/khaldarcv</a> ");
	addline("          LinkedIn: <a href='https://www.linkedin.com/in/khaldar'>khaldar</a> ");
	addline("          Github: <a href='https://github.com/kaustavha'>kaustavha</a> ");
	addline("");
	addline("Please reach out if you think I'd be a good fit for anything you're looking for. ")
	// addline("Are you still interviewing candidates?  And do you think I'd be a good fit for this or anything else you're looking for?");
	addline("Looking forward to hearing back from you.");
	addline("");
	addline("Thanks, ");
	addline("Kaustav Haldar ");

	content = "<p style='white-space:pre;display:block;overflow-wrap:normal;'>" + content + "</p>";

	let as = 'tell application "Microsoft Outlook"';
	as += '\n set theContent to "' + content + '"';
	as += '\n   set newMessage to make new outgoing message with properties {subject:"' + defaultsubject + '", content:theContent} ';
	as += '\n   make new to recipient at newMessage with properties {email address: {address:"' + mainEmail + '"}}';
	// as += '\n   make new to recipient at newMessage with properties {email address: {address:"hi@kaustav.me"}}';
	if (e.length > 1) {
		for (var i = 1; i < e.length; i++) {
			as += '\n    make new cc recipient at newMessage with properties {email address: {address:"' + e[i] + '"}}';
		}
	}
	as += '\n   send message id (id of newMessage)';
	as += '\nend tell';

	fcontent += '\n' + as;

	return fcontent;
}

function getHNPosts(pageN) {
	pageN = pageN || 1;
	return new Promise(res => {
		return _getHNPosts(pageN).then(dat => {
			if (dat == oldDat) {
				fs.writeFileSync(jobsListfs, fullDat);
				return res(fullDat);
			}
			fullDat += dat;
			oldDat = dat;
			pageN++;
			return getHNPosts(pageN).then(x => res(x));
		});
	})
}

function _getHNPosts(pageN) {
	let url = `https://news.ycombinator.com/item?id=${hnurlid}&p=${pageN}`;
	return new Promise(res => {
		extractContent(url).then(dat => {
			let buf = '';
			html = $(dat);
			commtext = html.find('.commtext');
			$.each( commtext, function( key, value ) {
				buf += $(value).html();
			});
			res(htmlDecodeWithLineBreaks(buf))
		})
	})
}

function extractContent(url) {
		let dat = '';
		return new Promise(resolve => {
			https.get(url, res => {
				res.on('data', function( data ) {
					dat += data;
				});
				res.on('end', () => {
					resolve(dat);
				})
		
			});
		})
}

// pollyfill
function htmlDecodeWithLineBreaks(html) {
	var breakToken = '_______break_______',
		lineBreakedHtml = html.replace(/<br\s?\/?>/gi, breakToken).replace(/<p\.*?>(.*?)<\/p>/gi, breakToken + '$1' + breakToken);
	return $('<div>').html(lineBreakedHtml).text().replace(new RegExp(breakToken, 'g'), '\n');
}