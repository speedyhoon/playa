package main

import (
	"encoding/json"
	"fmt"
	"github.com/speedyhoon/cnst/hdr"
	"github.com/speedyhoon/cnst/mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func serveDir(dir, contentType string) {
	http.Handle(dir,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			//Don't cache any responses
			//w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			//w.Header().Set("Pragma", "no-cache")
			//w.Header().Set("Expires", "0") //Expires now
			//if dir != "/" {        //root index
			//w.Header().Set("Content-Type", mimeType(dir)) //Expires now
			w.Header().Set(hdr.ContentType, contentType) //Expires now
			//w.Header().Set("Cache-Control", "public, max-age=31536000")
			//w.Header().Set("Vary", "Accept-Encoding") //stackoverflow.com/questions/14540490/is-vary-accept-encoding-overkill
			//}
			//Always set a gzip compressed response
			//w.Header().Set("Content-Encoding", "gzip")

			//if dir == dirGZIP {
			//Gzip directory expects serves compressed gzip files
			//http.FileServer(http.Dir(dirRoot)).ServeHTTP(w, r)

			//This wouldn't be needed if all HTML files were stripped of their file extensions
			//if dir == "/" && r.URL.Path != "/" {
			//	//r.URL.Path = strings.Replace(r.URL.Path, ".html", "", -1)
			//	r.URL.Path += ".html"
			//}
			http.FileServer(http.Dir("")).ServeHTTP(w, r)
			//} else {
			//zip(http.FileServer(http.Dir(dirRoot)), w, r)
			//zip(http.FileServer(http.Dir("")), w, r)
			//}
		}))
}

func main() {

	//serveDir(dirBR)
	serveDir("/css/", mime.CSS)
	//serveDir("/g/", "image/gif")
	//serveDir("/html/", "text/html; charset=utf-8")
	//serveDir("/e/", "image/jpeg")
	serveDir("/js/", mime.JS)
	serveDir("/png/", mime.PNG)
	//serveDir("/v/", "image/svg+xml")
	//serveDir("/w/", "image/webp")
	serveDir("/", mime.HTML)
	//serveDir(dirGZIP, "text/javascript")

	http.HandleFunc("/library2", library)

	if err := http.ListenAndServe(":4444", nil); err != nil {
		fmt.Println(err)
	}
}

func library(w http.ResponseWriter, r *http.Request) {
	const root = "library"
	var tracks []Track
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if info == nil {
			return nil
		}

		if !info.IsDir() && !strings.HasSuffix(info.Name(), ".jpg") {
			//fmt.Println("dir", path, info.Name())
			//}else{
			//fmt.Println("file", path, info.Name())
			tracks = append(tracks, trackDetails(root, path, info.Name()))
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
	}

	//Marshal user data into bytes.
	buf, err := json.Marshal(tracks)
	if err != nil {
		fmt.Fprint(w, err)
		return
	}

	//for _, t := range tracks{
	//	fmt.Println(t)
	//}

	fmt.Fprintf(w, "%s", buf)
}

type Track struct {
	Artist, Album, Title, Dir, File string
}

func trackDetails(root, path, name string) Track {
	path = strings.Replace(path, `\`, "/", -1)
	path = strings.TrimPrefix(path, root+"/")
	name = strings.TrimSuffix(path, ".mp3")
	dirs := strings.Split(name, "/")
	//fmt.Println(path, dirs)

	dir := strings.Replace(filepath.Dir(path), `\`, "/", -1)

	switch len(dirs) {
	case 0:
		return Track{}
	case 1:
		return Track{Title: dirs[0], File: filepath.Base(path), Dir: dir}
	case 2:
		return Track{Artist: dirs[0], Title: dirs[1], File: filepath.Base(path), Dir: dir}
	default:
		return Track{Artist: dirs[0], Album: dirs[1], Title: dirs[2], File: filepath.Base(path), Dir: dir}
	}
	return Track{}
}

/*func zip(h http.Handler, w http.ResponseWriter, r *http.Request) {
	gz := gzip.NewWriter(w)
	defer gz.Close()
	gzr := gzipResponseWriter{Writer: gz, ResponseWriter: w}
	h.ServeHTTP(gzr, r)
}

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}*/
